"""
SentinelOps ML Service — Model Loading & Inference

Singleton pattern for loading the DistilBERT sentiment analysis model.
Uses HuggingFace `pipeline` for optimized inference.

The model is loaded once at startup via the FastAPI lifespan context manager
and reused across all requests. Uses sync (def) endpoints because inference
is CPU-bound — FastAPI runs these in a threadpool automatically.
"""

import os
import time
import logging
from typing import Dict, List, Optional

from transformers import pipeline

from app.metrics import MODEL_LOAD_TIME

logger = logging.getLogger("sentinelops.model")


class SentimentModel:
    """
    Manages the lifecycle of the DistilBERT sentiment analysis model.

    Attributes:
        model_name: HuggingFace model identifier.
        pipeline: The loaded inference pipeline (None until load() is called).
        load_time: Time in seconds it took to load the model.
        loaded_at: Timestamp when the model finished loading.
    """

    def __init__(self):
        self.model_name: str = os.getenv(
            "MODEL_NAME", "distilbert-base-uncased-finetuned-sst-2-english"
        )
        self.cache_dir: str = os.getenv("MODEL_CACHE_DIR", "./models")
        self._pipeline = None
        self.load_time: Optional[float] = None
        self.loaded_at: Optional[float] = None

    @property
    def is_loaded(self) -> bool:
        """Check if the model pipeline is loaded and ready."""
        return self._pipeline is not None

    def load(self) -> None:
        """
        Load the model pipeline from HuggingFace Hub (or local cache).

        Downloads the model on first run, then caches it in MODEL_CACHE_DIR.
        Subsequent starts use the cached version (PVC in Kubernetes).
        """
        logger.info(
            "Loading model: %s (cache_dir: %s)", self.model_name, self.cache_dir
        )
        start = time.perf_counter()

        try:
            self._pipeline = pipeline(
                task="sentiment-analysis",
                model=self.model_name,
                model_kwargs={"cache_dir": self.cache_dir},
                tokenizer=self.model_name,
            )
            self.load_time = round(time.perf_counter() - start, 3)
            self.loaded_at = time.time()

            # Record load time in Prometheus
            MODEL_LOAD_TIME.set(self.load_time)

            logger.info(
                "Model loaded successfully in %.3fs: %s",
                self.load_time,
                self.model_name,
            )
        except Exception as e:
            logger.error("Failed to load model: %s", str(e))
            raise

    def predict(self, text: str) -> Dict:
        """
        Run sentiment analysis on a single text.

        Args:
            text: Input text string.

        Returns:
            dict with keys: label, score, inference_time_ms
        """
        if not self.is_loaded:
            raise RuntimeError("Model is not loaded. Call load() first.")

        start = time.perf_counter()
        result = self._pipeline(text, truncation=True, max_length=512)
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

        return {
            "label": result[0]["label"],
            "score": round(result[0]["score"], 4),
            "inference_time_ms": elapsed_ms,
        }

    def predict_batch(self, texts: List[str]) -> List[Dict]:
        """
        Run sentiment analysis on a batch of texts.

        Args:
            texts: List of input text strings.

        Returns:
            List of dicts, each with keys: label, score, inference_time_ms
        """
        if not self.is_loaded:
            raise RuntimeError("Model is not loaded. Call load() first.")

        start = time.perf_counter()
        results = self._pipeline(texts, truncation=True, max_length=512, batch_size=8)
        total_ms = round((time.perf_counter() - start) * 1000, 2)

        predictions = []
        for text, result in zip(texts, results):
            predictions.append({
                "label": result["label"],
                "score": round(result["score"], 4),
                "inference_time_ms": round(total_ms / len(texts), 2),
            })

        return predictions

    def get_info(self) -> Dict:
        """Return model metadata."""
        return {
            "model_name": self.model_name,
            "model_loaded": self.is_loaded,
            "load_time_seconds": self.load_time,
            "supported_labels": ["POSITIVE", "NEGATIVE"],
        }

    def unload(self) -> None:
        """Release the model from memory."""
        logger.info("Unloading model: %s", self.model_name)
        self._pipeline = None
        self.load_time = None
        self.loaded_at = None


# ---------------------------------------------------------------------------
# Module-level singleton — shared across the entire application
# ---------------------------------------------------------------------------
sentiment_model = SentimentModel()
