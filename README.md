# National Grocery Database (MongoDB)

A NoSQL database design and performance-tuning project built around a national grocery dataset: **6M+ rows across seven CSV files**, modeled as MongoDB collections, queried with aggregation pipelines, and tuned using indexes and estimated query frequencies.

> **Course:** INFO 430, University of Washington (Jan 2025 – Mar 2025)
> **Team project.** See [My role](#my-role) for what I personally did.

## Headline result

Reordering the aggregation pipeline and adding an index on `Discount` cut the "top 5 discounted products" query from **~340 ms to ~4 ms**.

| Query | Before | After |
|---|---|---|
| Top 5 discounted products (avg) | 340 ms | **4 ms** |
| Check if a product is under $10 (avg) | 95.252 ms | 95.252 ms |
| Top sold category (avg) | 2 ms | 2 ms |
| Products in multiple categories (avg) | 1 ms | 1 ms |
| Top cities by employment (avg) | 2 ms | 2 ms |
| **Sum of average runtimes** | **440.252 ms** | **104.252 ms** |

Two changes were made to the discounts query at the same time (the index and the pipeline reorder), so the speedup is credited to both together. See [Optimization](optimization.md) for details and limitations.

## What this project covers

- **Data modeling:** entity-relationship diagram for a national grocery system tracking countries, cities, customers, product categories, products, employees, and sales
- **Data loading:** importing seven CSV files (6M+ rows) into MongoDB, with light cleaning (an `"unknown"` value in a boolean column converted to `null`)
- **Query design:** 20 business questions, five of which were implemented and tested as MongoDB queries, each with an estimated daily frequency
- **Performance tuning:** index experiments, pipeline restructuring, and a decision *not* to keep an index that didn't pay for itself
- **Keeping source IDs:** using the dataset's existing ID columns instead of MongoDB's auto-generated `_id` values, to preserve relationships between collections

## Tech

MongoDB · MongoDB Atlas (free cloud cluster) · Aggregation pipelines · Indexing · Entity-relationship diagrams

## Documentation

| File | Contents |
|---|---|
| [design.md](design.md) | ER diagram, the 20 business questions, database setup, data loading |
| [queries.md](queries.md) | Implemented queries with estimated daily frequencies |
| [optimization.md](optimization.md) | Index experiments, pipeline changes, runtimes, limitations |
| [queries.js](queries.js) | All queries and index statements in one runnable file |

## Repository structure

```
grocery-database/
├── README.md
├── Design.md
├── Queries.md
├── Optimization.md
├── queries.js
└── images/
    └── erd.png
```

## Data
 
The project uses the [Grocery Sales Database](https://www.kaggle.com/datasets/andrexibiza/grocery-sales-dataset) from Kaggle, published by andrexibiza. It contains simulated grocery sales data from 2018-01-01 to 2018-05-09. Because the data is simulated, the project is about database design and performance tuning, not real-world sales findings.
 
The CSV files are not included in this repo because of their size. To reproduce the project, download them from the Kaggle page above.

## Role

I served as the team's **database administrator** and **database developer**.
 
**Database administrator**
- Set up and managed the MongoDB Atlas cluster
- Loaded the seven CSV files (6M+ rows) and tested the data after import, including converting an `"unknown"` boolean value to `null`
  
**Database developer**
- Estimated the feasibility of the proposed queries before building them
- Wrote, tested, and implemented the MongoDB queries
- Evaluated indexes and pipeline changes against measured runtimes
- Authored the project documentation: query write-ups with frequency estimates, and the optimization analysis explaining which changes were kept and why


## What I'd do next

- Re-run the discounts query with the index and the pipeline change applied **separately**, to measure how much each one contributed
- Test moving `$limit` earlier in the pipeline, before the `$lookup`, so fewer documents get joined (untested idea)
- Check whether the 95 ms "product under $10" query could benefit from a compound or price index, since it's now the slowest query in the set
