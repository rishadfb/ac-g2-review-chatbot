import json
import os
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
    lambda row: f"Likes: {row['Review Likes']} . Dislikes: {row['Review Dislikes']} . Problem: {row['Review Problem']} . Recommendations: {row['Review Recommendations']}",
    axis=1,
)

# Generate embeddings for each combined review
print("Generating embeddings for each review...")
embeddings = [get_embedding(review) for review in df["combined_review"]]

# Add embeddings to the DataFrame
print("Adding embeddings to DataFrame...")
df["embedding"] = embeddings

# Save the DataFrame back to CSV
print("Saving DataFrame to CSV...")
df.to_csv("embeddings/g2_rev_data_one_embeddings.csv", index=False)

# Prepare data for insertion
print("Inserting data into Supabase...")

for index, row in df.iterrows():
    data_row = {
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
    supabase.table("reviews").upsert(data_row).execute()

print("Insertion complete.")
