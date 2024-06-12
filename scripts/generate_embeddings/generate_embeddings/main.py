import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from multiprocessing import Pool, cpu_count
from uuid import uuid4

import pandas as pd
from dotenv import load_dotenv
from openai import OpenAI
from supabase import Client, create_client

load_dotenv()

# Set your OpenAI API key
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# To insert directly into Supabase, use the supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# Function to generate embeddings using OpenAI
def get_embedding(text):
    response = client.embeddings.create(model="text-embedding-ada-002", input=text)
    return response.data[0].embedding

# Read the CSV file
print("Reading CSV file...")
df = pd.read_csv("data/g2_rev_data_one.csv")

# Fill NaN values with an empty string
df = df.fillna("")

# Combine the review sections
print("Combining review sections...")
df["combined_review"] = df.apply(
    lambda row: f"Title: {row['Review Title']} . Likes: {row['Review Likes']} . Dislikes: {row['Review Dislikes']} . Problem: {row['Review Problem']} . Recommendations: {row['Review Recommendations']}",
    axis=1,
)

# Generate embeddings for each combined review in parallel
print("Generating embeddings for each review...")


def generate_embeddings_in_parallel(reviews):
    with ThreadPoolExecutor(max_workers=cpu_count()) as executor:
        future_to_review = {
            executor.submit(get_embedding, review): review for review in reviews
        }
        embeddings = []
        for future in as_completed(future_to_review):
            review = future_to_review[future]
            try:
                embedding = future.result()
                embeddings.append(embedding)
            except Exception as exc:
                print(f"Review {review} generated an exception: {exc}")
                embeddings.append(None)
    return embeddings


df["embedding"] = generate_embeddings_in_parallel(df["combined_review"].tolist())

# Save the Dataframe back to CSV
print("Saving Dataframe to CSV...")
df.to_csv("embeddings/g2_rev_data_one_embeddings.csv", index=False)

# Prepare data for batch insertion
print("Preparing data for insertion...")
data_rows = [
    {
        "reviewer_name": row["Reviewer Name"],
        "reviewer_job_title": row["Reviewer Job Title"],
        "reviewer_business_size": row["Reviewer Business Size"],
        "rating": row["Rating"],
        "review_date": row["Review Date"],
        "review_title": row["Review Title"],
        "review_likes": row["Review Likes"],
        "review_dislikes": row["Review Dislikes"],
        "review_problem": row["Review Problem"],
        "review_recommendations": row["Review Recommendations"],
        "review_link": row["Review Link"],
        "embedding": row["embedding"],
    }
    for index, row in df.iterrows()
]


# Batch insert data into Supabase
def batch_insert_to_supabase(data_rows, batch_size=100):
    for i in range(0, len(data_rows), batch_size):
        batch = data_rows[i : i + batch_size]
        supabase.table("reviews").upsert(batch).execute()


print("Inserting data into Supabase...")
batch_insert_to_supabase(data_rows)

print("Insertion complete.")
