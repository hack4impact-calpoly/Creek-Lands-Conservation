# Waiver Management System Research

## Dynamic Waiver Templates
### Database Structure
To structure waiver templates in the database better, 
JSON Schema is probably best used. Makes flexibility and easier to implement,
allowing new templates to be added without modifying the database schema.

**Example JSON Schema:**
```json
{
  "title": "Waiver Template",
  "type": "object",
  "properties": {
    "template_id": { "type": "string" },
    "name": { "type": "string" },
    "fields": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "field_id": { "type": "string" },
          "label": { "type": "string" },
          "type": { "type": "string", "enum": ["text", "checkbox", "date", "signature"] },
          "required": { "type": "boolean" }
        }
      }
    }
  }
}
```
**Source:** [JSON Schema Documentation](https://json-schema.org/learn/json-schema-examples)

### Dynamic Fields
Waiver templates should support dynamic fields that can be autofilled using user profiles. 
These fields include:
- Participant Name
- Guardian Name
- Event Name

Example:
```json
{
  "template_id": "waiver_001",
  "name": "General Liability Waiver",
  "fields": [
    { "field_id": "participant_name", "label": "Participant Name", "type": "text", "required": true },
    { "field_id": "guardian_name", "label": "Guardian Name", "type": "text", "required": false },
    { "field_id": "event_name", "label": "Event Name", "type": "text", "required": true }
  ]
}
```

## Field Label Variations
To handle label variations, a mapping system 
should be added to ensure consistent autofill functionality.

Example:
```json
{
  "standard_fields": {
    "guardian_name": ["Guardian Name", "Parent Name"],
    "participant_name": ["Participant Name", "Attendee Name"],
    "event_name": ["Event Name", "Activity Name"]
  }
}
```
**Source:** [Data Standardization Techniques](https://www.data.gov/)

## Autofill Functionality
### Using User Profiles
User profiles should store participant data to enable automatic population of waiver fields.

Example user profile:
```json
{
  "user_id": "12345",
  "name": "John Doe",
  "guardian_name": "Jane Doe",
  "past_events": ["Kayaking Trip", "Hiking Expedition"]
}
```