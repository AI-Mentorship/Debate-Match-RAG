import json
import argparse
from .fact_checker import claim_verdict

# Command-line interface for testing fact-checker.
def run_cli():
    parser = argparse.ArgumentParser(description = "Fact-checker for Debate Match")
    parser.add_argument("claim", type = str, help = "Claim to fact-check")
    parser.add_argument("--top", type = int, default = 3, help = "Top K results")
    parser.add_argument("--no-news", action="store_true", help = "Skip NewsAPI search.")
    parser.add_argument("--raw", action = "store_true", help = "Print raw JSON")
    args = parser.parse_args()
    
    result = claim_verdict(args.claim, top_k = args.top, use_news = (not args.no_news))
    
    if args.raw:
        print(json.dumps(result, indent = 2))
    else:
        print("Claim:", result["claim"])
        print("Verdict:", result["verdict"], f"(confidence {result['confidence']:.2f})")
        print("Badge:", result["badge_html"])
        print("\nPer-source evidence:")
        for entry in result["per_source"]:
            print(f"- [{entry['source']}] {entry.get('title')} -> {entry['label']} ({entry['score']:.2f})")
            if entry.get("url"):
                print("  URL:", entry["url"])
            snippet_preview = (entry.get("snippet") or "")[:200]
            if snippet_preview:
                print("  Snippet:", snippet_preview.replace("\n", " "))


if __name__ == "__main__":
    run_cli()