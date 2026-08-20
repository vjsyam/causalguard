import numpy as np
import pandas as pd
import os
import warnings
warnings.filterwarnings('ignore')

SEED = 42
np.random.seed(SEED)

N_TOTAL = 100_000
FRAUD_RATE = 0.035
N_FRAUD = int(N_TOTAL * FRAUD_RATE)
N_LEGIT = N_TOTAL - N_FRAUD

DISPOSABLE_DOMAINS = {
	"mailnull.com", "guerrillamail.com", "throwam.com", "yopmail.com",
	"tempmail.com", "sharklasers.com", "spam4.me", "trashmail.com"
}

COMMON_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com",
			     "iCloud.com", "protonmail.com", "aol.com", "msn.com"]


def generate_transactions(n, fraud=False):
	rng = np.random.RandomState(SEED + int(fraud))
	cards = rng.randint(1000, 9999, size=n)
	base_dt = 86400
	if fraud:
		dt = rng.exponential(scale=base_dt * 2, size=n).astype(int)
	else:
		dt = rng.uniform(0, base_dt * 180, size=n).astype(int)
	if fraud:
		amt = np.abs(rng.normal(loc=350, scale=200, size=n))
	else:
		amt = np.abs(rng.lognormal(mean=4.0, sigma=1.2, size=n))
	devices = ["desktop", "mobile", "tablet"]
	if fraud:
		device_type = rng.choice(devices, size=n, p=[0.3, 0.5, 0.2])
	else:
		device_type = rng.choice(devices, size=n, p=[0.55, 0.35, 0.1])
	disposable = list(DISPOSABLE_DOMAINS)
	if fraud:
		p_email = rng.choice(disposable + COMMON_DOMAINS, size=n,
							 p=[0.08]*len(disposable) + [0.36/len(COMMON_DOMAINS)]*len(COMMON_DOMAINS))
	else:
		p_email = rng.choice(COMMON_DOMAINS, size=n)
	if fraud:
		dist1 = np.abs(rng.normal(loc=300, scale=200, size=n))
	else:
		dist1 = np.abs(rng.exponential(scale=50, size=n))
	dist2 = dist1 * rng.uniform(0.8, 1.2, size=n) + rng.normal(0, 10, size=n)
	dist2 = np.abs(dist2)
	card4 = rng.choice(["visa", "mastercard", "discover", "amex"], size=n)
	card6 = rng.choice(["credit", "debit"], size=n, p=[0.6, 0.4] if not fraud else [0.75, 0.25])
	addr1 = rng.randint(100, 600, size=n)
	addr2 = rng.randint(10, 100, size=n)
	prods = ["W", "H", "C", "S", "R"]
	if fraud:
		prod_cd = rng.choice(prods, size=n, p=[0.35, 0.25, 0.2, 0.1, 0.1])
	else:
		prod_cd = rng.choice(prods, size=n, p=[0.25, 0.15, 0.35, 0.15, 0.1])
	if fraud:
		c1 = rng.randint(3, 15, size=n)
		c2 = rng.randint(2, 10, size=n)
	else:
		c1 = rng.randint(0, 5, size=n)
		c2 = rng.randint(0, 3, size=n)
	c3 = rng.randint(0, 5, size=n)
	c4 = rng.randint(0, 4, size=n)
	c5 = rng.randint(0, 6, size=n)
	device_info = ["Windows", "MacOS", "iOS", "Android", "Linux"]
	if fraud:
		dev_info = rng.choice(device_info, size=n, p=[0.2, 0.1, 0.3, 0.35, 0.05])
	else:
		dev_info = rng.choice(device_info, size=n, p=[0.45, 0.2, 0.15, 0.15, 0.05])
	offset = 0 if not fraud else N_LEGIT
	tx_ids = np.arange(1000000 + offset, 1000000 + offset + n)
	return pd.DataFrame({
		"TransactionID": tx_ids,
		"TransactionDT": dt,
		"TransactionAmt": amt,
		"card1": cards,
		"card4": card4,
		"card6": card6,
		"addr1": addr1,
		"addr2": addr2,
		"dist1": dist1,
		"dist2": dist2,
		"P_emaildomain": p_email,
		"ProductCD": prod_cd,
		"C1": c1, "C2": c2, "C3": c3, "C4": c4, "C5": c5,
		"DeviceType": device_type,
		"DeviceInfo": dev_info,
		"isFraud": int(fraud),
	})


def generate_and_save(out_dir="D:/causalguard-razorpay/backend/data"):
	os.makedirs(out_dir, exist_ok=True)
	print("Generating synthetic transaction data...")
	legit = generate_transactions(N_LEGIT, fraud=False)
	fraud_df = generate_transactions(N_FRAUD, fraud=True)
	df = pd.concat([legit, fraud_df], ignore_index=True).sample(frac=1, random_state=SEED)
	df.reset_index(drop=True, inplace=True)
	path_tx = os.path.join(out_dir, "train_transaction.csv")
	df.to_csv(path_tx, index=False)
	print(f"Saved: {path_tx}  ({len(df)} rows)")
	print(f"Fraud rate: {df.isFraud.mean()*100:.2f}%")
	return path_tx

if __name__ == "__main__":
	generate_and_save()