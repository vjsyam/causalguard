import json
from sqlalchemy import Column, String, Float, Integer, Boolean, Text
from .database import Base


class Transaction(Base):
    """Raw engineered feature row from the held-out test set."""
    __tablename__ = "transactions"

    transaction_id       = Column(String, primary_key=True, index=True)
    transaction_amt      = Column(Float, nullable=False)
    velocity_1h          = Column(Integer, default=0)
    velocity_24h         = Column(Integer, default=0)
    amount_zscore_high   = Column(Integer, default=0)
    device_anomaly       = Column(Integer, default=0)
    email_domain_risk    = Column(Integer, default=0)
    distance_anomaly     = Column(Integer, default=0)
    card_addr_mismatch   = Column(Integer, default=0)
    product_risk         = Column(Integer, default=0)
    high_c_counter       = Column(Integer, default=0)
    is_fraud             = Column(Integer, default=0)
    # Scored results
    fraud_score          = Column(Float, nullable=True)
    flagged              = Column(Boolean, default=False)
    active_anomalies_json = Column(Text, nullable=True)
    causal_path_json     = Column(Text, nullable=True)

    @property
    def active_anomalies(self):
        return json.loads(self.active_anomalies_json or "[]")

    @property
    def causal_path(self):
        return json.loads(self.causal_path_json or "[]")
