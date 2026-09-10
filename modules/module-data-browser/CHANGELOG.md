# @ja-platform/reactor-mod-data-browser

## 3.6.7

### Patch Changes

- 428d2f7: dependency changes

## 3.6.6

### Patch Changes

- 4b5fa1d: Publish the data browser as `@ja-platform/reactor-mod-data-browser` on npm.

## 3.6.5

### Patch Changes

- 4b5fa1d: Include the compiled Reactor module bundle in the published package.

## 3.6.4

### Patch Changes

- c5fe798: New reactor apis

## 3.6.3

### Patch Changes

- 14ce141: Bump all dependencies

## 3.6.3

### Patch Changes

- 5081ec5: Bump reactor to V6

## 3.6.2

### Patch Changes

- cc44c87: small refactor

## 3.6.1

### Patch Changes

- e5eb224: Improve data browser query and model editing workflows.
  - Fix empty query result sets showing a perpetual page-count spinner and keep the page selector disabled when no pages are available.
  - Add a primary "Create model" action to simple query panels.
  - Fix new model forms and restored new model panels so draft objects hydrate correctly.
  - Fix clearing belongs-to relationships before saving.
  - Improve model and bulk-save feedback with button loading states, visor loading, and success notifications.
  - Adjust filter tooltip positioning to reduce table overflow.

## 3.6.0

### Minor Changes

- 25ca8e5: Add schema model delete workflows to the data browser.
  - Add a delete action for individual schema model records.
  - Add batch delete for multi-selected query rows.
  - Add query table selection controls and selected-row context menu actions for batch operations.
  - Close open model panels and refresh query views after records are deleted.

## 3.5.0

### Minor Changes

- 794a3d6: Add configurable schema and query display preferences in the data browser.
  - add schema ordering preferences for models and fields, including schema-defined ordering for models and fields/relationships
  - apply shared field ordering consistently across table columns, forms, and filterable schema fields
  - add a query preference to toggle showing the raw ID value in the ID column while keeping the copy button available
  - add a query preference to place table controls at the top, bottom, or both, defaulting to both

## 3.4.0

### Minor Changes

- 4a150da: Expand Data Browser query tooling with better filtering, relationship workflows, and ID utilities.
  - Show type labels under column headings.
  - Add filtering support for boolean, belongs-to, and `ID` columns.
  - Group Add Filter options into `Fields` and `Belongs to`.
  - Make IDs easier to work with:
    - Add copy actions in ID cells.
    - Add copy support in relationship peek metadata.
    - Allow direct UUID paste in relationship search to resolve records by ID.
  - Improve relationship workflows:
    - Add `View has many` from row context menus to open related records in a pre-filtered query.
    - Add `Filter belongs to` from relationship peek to apply a query filter from the selected related object.
  - Make the `ID` column filterable but no longer sortable.

## 3.3.0

### Minor Changes

- 928d844: Connections now have an online status

## 3.2.1

### Patch Changes

- 5b59443: Update labs/reactor packages

## 3.2.0

### Minor Changes

- 35229c1: Improve query panel state behavior for data browser queries.
  - Default new simple queries to sort by `updated_at` descending.
  - Keep in-memory query page and table scroll offsets when switching tabs.
  - Fix browser-reload query panels getting stuck by reactively triggering initial query load after hydration.

## 3.1.3

### Patch Changes

- 8825f60: Bump dependencies

## 3.1.2

### Patch Changes

- 4761497: bump deps

## 3.1.1

### Patch Changes

- 4e3887d: Bump dependencies

## 3.1.0

### Minor Changes

- 9422edc: Ship a major Query Controls upgrade focused on speed, clarity, and persistence.

  Highlights:
  - Add a full Sort Controls experience:
    - Multi-column sorting with ASC/DESC directions.
    - Clickable table headers to cycle sort states.
    - Drag-and-drop reordering of sort priority (DnD3).
    - Sort state persisted in saved queries.
  - Add a Filter Controls group in table controls:
    - `+` picker to add/edit filters by field.
    - Metadata-based filter chips (reusing filter-provided metadata).
    - Explicit filter removal via chip actions.
  - Expand filter capabilities:
    - Statement-based filters support multiple conditions and global AND/OR matching.
    - Text filters now support `=`, `starts with`, and `contains`.
    - Number and date filters support comparison operators via form-driven setup.
  - Improve loading UX for query updates:
    - Keep the current page rendered while new data loads.
    - Hot-swap page data only when the next page is ready.
    - Show a lightweight loading spinner in query controls instead of jarring content loaders.
  - Add new user preferences under `Query Controls`:
    - Show sort controls.
    - Show filter controls.
  - Add connection color coding across Data Browser:
    - Persist a per-connection color with sensible defaults for new/existing connections.
    - Add a `Set connection color` action using the new ComboBox2 flow.
    - Add connection color selection to the manual connection form via a set input.
    - Render connection color indicators in panel tabs and connection entity presentation.

  Also includes internal refactors for cleaner handler-owned filter setup, filter serialization typing, and modularized table-control widgets.

### Patch Changes

- 660e4e8: Migrate Data Browser action registration and lookup to `ActionStore` for compatibility with the latest Reactor action wiring patterns.

## 3.0.2

### Patch Changes

- c0c6df1: Bump all dependencies

## 3.0.1

### Patch Changes

- e539ae2: Make sure to clear connection array when deserializing since we are able to also swap out deserializers

## 3.0.0

### Major Changes

- c0d7e9d: Abstract connections now need to generate a V4BackendClient as we now show indexes

## 2.4.0

### Minor Changes

- 98c2c03: Add editor module allowing for various JSON utilities such as viewing JSON and downloading as JSON
- bcd307e: Support for new multi types and the ability to clear values in the forms

### Patch Changes

- a8f7424: Fix location input

## 2.3.0

### Minor Changes

- bb7000e: Rewrite the data engine

## 2.2.0

### Minor Changes

- 12e5f6a: - Add support for filters
  - Fix relationship belongs_to loading
  - Display column headings with width based on heurestics

### Patch Changes

- 687468b: - Improve relationship loading
  - Dont block kernel init with connection store

## 2.1.0

### Minor Changes

- 8cc96ec: - displays media directly inside Sector
  - add media input fields to form editing
  - status bar for schema model editing
  - make query reload button show load status
  - Add support for Locations
  - Pull in Reactor changes: Version Packages reactor#36
- bf70874: Add support for loading relationships with smart paralell limits

## 2.0.2

### Patch Changes

- 375d338: Add support for Day and number type

## 2.0.1

### Patch Changes

- 0f04f63: Fix an issue with text not showing correctly and also improve array items

## 2.0.0

### Major Changes

- 3438cf4: Name of connection changed to an EntityDescription and also export shared db library

## 1.1.0

### Minor Changes

- cd5ddb0: Export various classes and types

## 1.0.0

### Major Changes

- 60d9391: First release
