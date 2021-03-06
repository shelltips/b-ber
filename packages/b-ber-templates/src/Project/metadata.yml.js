module.exports = `# ==============================================================================
# Project Metadata
# Please see http://dublincore.org/documents/dcmi-terms/ for information on terms
# and ususage. TK Please note that additional metadata can be entered and parsed
# if following the outline below.
# ------------------------------------------------------------------------------

# ------------------------------------------------------------------------------
# Title and Description
# ------------------------------------------------------------------------------
- term: title
  value: Project Title
  term_property: title-type
  term_property_value: main

- term: description
  value: Project description.

- term: abstract
  value: Abstract.

# ------------------------------------------------------------------------------
# Contributors
# ------------------------------------------------------------------------------

- term: creator
  value: Last Name, First Name
  term_property: role
  term_property_value: aut

- term: contributor
  value: b-ber
  term_property: role
  term_property_value: mrk

# ------------------------------------------------------------------------------
# Collaborators (editors, developers, designers, researchers, etc.)
# ------------------------------------------------------------------------------

- term: contributor
  value: Last Name, First Name
  term_property: role
  term_property_value: edt

- term: contributor
  value: Last Name, First Name
  term_property: role
  term_property_value: drt

- term: contributor
  value: Last Name, First Name
  term_property: role
  term_property_value: ard
- term: contributor
  value: Last Name, First Name
  term_property: role
  term_property_value: pmn
- term: contributor
  value: Last Name, First Name
  term_property: role
  term_property_value: pmn
- term: contributor
  value: Last Name, First Name
  term_property: role
  term_property_value: prg
- term: contributor
  value: Last Name, First Name
  term_property: role
  term_property_value: dsr
- term: contributor
  value: Last Name, First Name
  term_property: role
  term_property_value: mrk
- term: contributor
  value: Last Name, First Name
  term_property: role
  term_property_value: rtm

# ------------------------------------------------------------------------------
# Publication Information
# ------------------------------------------------------------------------------

- term: language
  value: en-US
- term: rights
  value: © YYYY
- term: format
  value: epub+zip
- term: date
  value: YYYY-MM-DD
- term: publisher
  value: Publisher
- term: tableOfContents
  value: 'Chapter One; Chapter Two; etc.'

# ------------------------------------------------------------------------------
# Additional Metadata
# ------------------------------------------------------------------------------

- term: temporal
  value: time
- term: spatial
  value: Project Title Location
- term: subject
  value: Project Title Subject

# ------------------------------------------------------------------------------
# Cover
# ------------------------------------------------------------------------------
- term: identifier
  value: %IDENTIFIER%
`
