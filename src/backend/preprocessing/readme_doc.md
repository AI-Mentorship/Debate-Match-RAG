# Transcript Preprocessing - Person A

## Overview
This tool processes raw debate transcripts and converts them into clean, structured data formats (CSV and JSON) suitable for further analysis and embedding generation.

## Purpose
Transform messy debate transcripts with ads, stage directions, and headers into clean data with:
- Speaker identification
- Timestamps or line numbers
- Clean text content

## Input Format

### Expected Input
Raw text file (`.txt`) containing debate transcripts with:
- Speaker names followed by timestamps in parentheses
- Example: `Joe Biden ([03:45]): We got to take a look...`
- May contain noise like:
  - Commercial breaks
  - Stage directions in brackets `[APPLAUSE]`
  - Headers with `===` symbols
  - Advertisement text
  - Technical notes

### Sample Input
```
===== DEBATE TRANSCRIPT =====
[COMMERCIAL BREAK]

Joe Biden ([03:45]):
We got to take a look at what I was left when I became president.

Donald Trump ([05:40]):
We have the greatest economy in the history of our country.

[ADVERTISEMENT BREAK]
```

## Output Format

### CSV Output (`debate_clean.csv`)
```csv
line_number,speaker,timestamp,text
1,Joe Biden,03:45,We got to take a look at what I was left when I became president.
2,Donald Trump,05:40,We have the greatest economy in the history of our country.
```

### JSON Output (`debate_clean.json`)
```json
[
  {
    "line_number": 1,
    "speaker": "Joe Biden",
    "timestamp": "03:45",
    "text": "We got to take a look at what I was left when I became president."
  },
  {
    "line_number": 2,
    "speaker": "Donald Trump",
    "timestamp": "05:40",
    "text": "We have the greatest economy in the history of our country."
  }
]
```

## Installation

### Requirements
- Python 3.7 or higher
- No external libraries required (uses standard library only)

### Setup
1. Download `preprocess.py` to your project directory
2. Ensure you have a raw transcript file ready

## Usage

### Basic Command
```bash
python preprocess.py <input_file.txt>
```

### Example
```bash
python preprocess.py debate_raw.txt
```

### What Happens
1. Script reads your raw transcript file
2. Removes all noise (ads, headers, stage directions)
3. Extracts speaker turns with timestamps
4. Saves two output files:
   - `debate_raw_clean.csv`
   - `debate_raw_clean.json`

## Output Location
Output files are saved in the same directory as your input file with `_clean` appended to the filename.

## Cleaning Process

The script removes:
- **Stage directions**: `[APPLAUSE]`, `[CROWD NOISE]`
- **Commercial breaks**: `ADVERTISEMENT BREAK`, `COMMERCIAL BREAK`
- **Headers/footers**: Lines with `===` symbols
- **Promotional text**: `Visit CNN.com`, `Paid for by...`
- **Technical notes**: `AUDIO RESTORED`, `FACT CHECK`
- **Extra whitespace**: Multiple blank lines, trailing spaces

## Error Handling

### No speaker turns found
```
⚠️  Warning: No speaker turns found. Check your input file format.
Expected format: 'Speaker Name ([timestamp]): text'
```
**Solution**: Ensure your transcript follows the format `Speaker Name ([HH:MM:SS]): text`

### File not found
```
❌ Error: Input file 'filename.txt' not found!
```
**Solution**: Check that the filename and path are correct

## Testing

### Verify Output
After running the script, check:
1. Number of speaker turns extracted
2. Sample output shown in terminal
3. Open CSV/JSON files to inspect

### Sample Check
```bash
# Run the script
python preprocess.py debate_raw.txt

# Expected output:
# ✅ CSV saved to: debate_raw_clean.csv
# ✅ JSON saved to: debate_raw_clean.json
# ✨ Done! Preprocessing complete.
```

## Next Steps (Integration with Pipeline)

After preprocessing, the clean data files will be used by:
- **Person B**: Store transcripts in database
- **Person C**: Build embeddings for semantic search
- **Person D**: Retrieve relevant passages
- **Person E**: Generate answers with context
- **Person F**: Fact-check claims

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Script won't run | Check Python installation: `python --version` |
| No output files | Verify input file has correct speaker format |
| Empty CSV | Check that transcript has `Speaker ([time]):` format |
| Wrong data extracted | Review raw file for format inconsistencies |

## Files saved locally 
```
project/
├── preprocess.py          # Main preprocessing script
├── README.md             # This documentation
├── debate_raw.txt        # Input: Raw transcript
├── debate_raw_clean.csv  # Output: Clean CSV
└── debate_raw_clean.json # Output: Clean JSON
```

## Responsibilities Checklist
- [x] Write `preprocess.py` script
- [x] Document input format requirements
- [x] Document output format structure
- [x] Provide run command instructions
- [x] Handle errors gracefully
- [x] Generate both CSV and JSON outputs

## Contact
For questions about preprocessing, contact Person A (you!)