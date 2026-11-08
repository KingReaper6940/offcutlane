# Project, plan and receipt formats

Editable projects use `offcutlane-project-v1`. Exactly these root fields are supported: `schema`, `title`, `notes`, `unit`, `kerf`, `trimStart`, `trimEnd`, `stocks`, `parts`. Unit is mm or in.

Every stock/part row has exactly `id`, `label`, `length`, `qty`. Stock IDs s1–s999999 and part IDs p1–p999999 must be unique within their arrays. Labels may repeat. Physical copy IDs append a one-based ordinal: s1.2 or p3.1.

All lengths are nonnegative integer **thousandths of the selected unit**, never floating-point unit values. Row lengths must be positive. Quantity and text limits are in the README. Unknown fields, invalid UTF-8, unsafe controls, unpaired surrogates, duplicate IDs and excessive quantities reject the project. There is no hidden unit conversion or material inference.

Algorithm `best-fit-decreasing-v1` expands quantities in row/copy order, sorts pieces descending by length with stable source-order ties, then chooses the open bar giving the smallest post-placement remainder. If none fits, it opens the shortest fitting unused bar. An exact remaining-end match charges zero kerf; all other placements require length + kerf. Equal candidates retain expansion/open order.

The raw plan has `algorithm`, `bars`, `unplaced`. Each bar has its physical stock ID and cuts. Each cut has its physical piece ID, start/end offsets in original-stock coordinates, and kerfAfter. This is allocation geometry, not an actual machining sequence.

The independent audit rejects reused stock, duplicate/omitted pieces, incorrect start/end/kerf values, out-of-bounds geometry, negative remnants and failed conservation. Every requested copy must occur exactly once in the placed or unplaced partition. It checks geometry and accounting, **not optimality or physical cutting suitability**.

A `offcutlane-receipt-v1` export contains the entire editable project and its fresh audited result. It is not accepted as an editable import. Use project JSON to resume. HTML and SVG are presentation snapshots; SVG omits some fine labels and full notes by design.

The current project and 25-action undo history live only in memory. Successful imports enter the history. Failed or superseded file reads preserve the current job. Any newer file, draft input or saved action invalidates an older asynchronous read.
