-- Enable the pgvector extension
create extension if not exists vector;

-- Create the reviews table
create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  reviewer_name text,
  reviewer_job_title text,
  reviewer_business_size text,
  rating numeric,
  review_date timestamp,
  review_title text,
  review_likes text,
  review_dislikes text,
  review_problem text,
  review_recommendations text,
  review_link text,
  embedding vector(1536)
);
