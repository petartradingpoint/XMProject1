# Change Request 001: Support Multiple Authors per Book

## Business Context

The current API assumes that each book has exactly one author.

This needs to be changed because some books can have multiple authors.

Examples:
- "Good Omens" by Terry Pratchett and Neil Gaiman
- "The C Programming Language" by Brian Kernighan and Dennis Ritchie

## Required Change

A book must support one or more authors.

The existing single `author` field should be replaced with an `authors` field.

## API Contract Change

