# Legacy one-off maintenance scripts

These are throwaway `sed`-style patch scripts that were previously committed to the
repository root during early UI/content work. They are **not** referenced by any
`package.json` script and are not part of the build.

They are kept here (rather than deleted) purely for historical reference. Do not run
or extend them — they mutate source files with hard-coded string replacements and will
corrupt files if re-applied.
