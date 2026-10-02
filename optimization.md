# Optimization

This document covers the changes that were considered, which ones were kept, and why.

## Summary

| Change | Outcome | Decision |
|---|---|---|
| Index on `ProductID` (products) | Query time stayed nearly the same | **Not kept** |
| Index on `Price` (products) | Not tested; price filter runs rarely | **Not created** |
| Index on `Discount` (sales), descending | Efficient filtering and sorting of discounted items | **Kept** |
| Reordered the top-5-discounts pipeline | Less data processed by expensive stages | **Kept** |
| Using the dataset's own IDs instead of generated ones | Preserves relationships, simpler lookups | **Kept** (but slow to reload) |

## Changes considered

### 1. Index on `ProductID` (not kept)

**Hypothesis:** The top-sold-product query accesses `ProductID` frequently, so an index would speed up lookups and aggregations.

**Result:** Query time stayed nearly the same, which showed those queries were already fast enough. The index also would have helped the "is this product under $10" check, but that lookup was already so quick that the gain would be minimal.

**Decision:** The cost of creating and maintaining the index wasn't worth the small time savings.

### 2. Index on `Price` (considered, not created)
  
**Observation:** Filtering products by price (for example, checking whether an item costs under $10) took about 95 ms. Without an index on price, the database scans the entire products collection to answer it.
 
**Decision:** We chose not to add a price index. Based on our frequency estimates, this query would run rarely, so the time saved wouldn't justify maintaining another index.
 
Its runtime is included in the totals below, unchanged before and after, since we didn't modify it.

### 3. Index on `Discount` (kept)

**Hypothesis:** Queries retrieving the top five most discounted items filter and sort on `Discount`, so an index would speed both up. The index is ordered descending so the highest discounts are the cheapest to reach.

**Result:** The index worked as expected, letting the database filter discounted items efficiently and significantly improving execution time.

```js
db.sales.createIndex({ Discount: -1 });
```

### 4. Keeping the dataset's original IDs (kept)

When the data was inserted, MongoDB could have generated its own unique IDs instead of using the ID columns already in the dataset. Generated IDs would have required extra work to map back to the original IDs in every ID-based relationship. Using the existing IDs keeps relationships between collections intact, makes lookups more straightforward, and helps preserve data consistency.

The tradeoff is time: reinserting a dataset this large is slow.

### 5. Restructuring the top-5-discounts pipeline (kept)

The original pipeline joined the `products` collection to every sale *before* sorting, so a large amount of unnecessary data went through the expensive stages. The new version filters and sorts first, so those operations run on only the relevant documents.

**Before:**

```js
db.sales.aggregate([
  { $lookup: { from: "products", localField: "ProductID", foreignField: "ProductID", as: "product_info" } },
  { $unwind: "$product_info" },
  { $sort: { Discount: -1 } },
  { $limit: 5 },
  { $project: { _id: 0, ProductName: "$product_info.ProductName", Discount: 1 } }
]);
```

**After:**

```js
db.sales.aggregate([
  { $match: { Discount: { $gt: 0 } } },
  { $sort: { Discount: -1 } },
  { $lookup: { from: "products", localField: "ProductID", foreignField: "ProductID", as: "product_info" } },
  { $unwind: "$product_info" },
  { $project: { _id: 0, ProductName: "$product_info.ProductName", Discount: 1 } },
  { $limit: 5 }
]);
```

## Runtimes

Average runtimes per query:

| Query | Before | After |
|---|---|---|
| Check if product is under $10 | 95.252 ms | 95.252 ms |
| Top 5 discounted products | 340 ms | 4 ms |
| Top sold category | 2 ms | 2 ms |
| Products in multiple categories | 1 ms | 1 ms |
| Top cities by employment | 2 ms | 2 ms |
| **Sum of average runtimes** | **440.252 ms** | **104.252 ms** |

<!-- TODO: add screenshots of the before/after execution stats if you still have them, e.g. images/discounts-before.png and images/discounts-after.png -->

## Limitations and caveats

- **Two changes at once.** The `Discount` index and the pipeline reorder were applied together, so the 340 ms → 4 ms improvement can't be split between them. Testing each change separately would show which one mattered more.
- **Averages, not distributions.** Runtimes are averages, and the number of runs isn't recorded here. <!-- TODO: add the number of runs per query if you know it -->
- **Frequencies are estimates.** The daily frequencies in [queries.MD](queries.MD) are reasoned guesses, not measured usage.
- **The remaining slow query.** The "product under $10" check, at about 95 ms, is now the slowest query in the set and wasn't improved by these changes.

## Ideas to try next

- Run the index and the pipeline change separately to measure each one's contribution
- Move `$limit` before the `$lookup` so fewer documents are joined (untested; it assumes every sale has a matching product)
- Investigate why the under-$10 check takes ~95 ms and whether an index on price would help
