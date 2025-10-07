from playwright.sync_api import sync_playwright, Page, expect
import sys

def verify_usage_stats(page: Page):
    """
    This script verifies that the UsageStats component appears with cost information
    after a chat message is sent and a response is received.
    """
    try:
        # 1. Navigate to the application.
        print("Navigating to http://localhost:5173...")
        page.goto("http://localhost:5173", timeout=20000)

        # 2. Find the textarea and type a message.
        print("Typing a message into the textarea...")
        textarea = page.get_by_placeholder("How can BoltDIY help you today?")
        expect(textarea).to_be_visible(timeout=15000)
        textarea.fill("Hello, this is a test message to generate some tokens. Please respond with a short sentence.")

        # 3. Press Enter to send the message.
        print("Sending the message...")
        textarea.press("Enter")

        # 4. Wait for the usage stats to appear. This indicates the response has finished.
        # We will wait for the cost element to be visible.
        print("Waiting for the usage stats to appear...")
        cost_element = page.locator("div.flex.items-center.gap-1\\.5:has(svg.lucide-coins)")

        # The timeout needs to be long enough for the model to respond.
        expect(cost_element).to_be_visible(timeout=45000)

        # 5. Verify that the cost is greater than $0.0000.
        print("Verifying the cost is calculated...")
        cost_text_locator = cost_element.locator("span")
        expect(cost_text_locator).not_to_have_text("$0.0000", timeout=5000)

        # 6. Take a screenshot for visual confirmation.
        screenshot_path = "jules-scratch/verification/verification.png"
        print(f"Taking screenshot and saving to {screenshot_path}...")
        page.screenshot(path=screenshot_path)
        print("Screenshot taken successfully.")

    except Exception as e:
        print(f"An error occurred during verification: {e}", file=sys.stderr)
        page.screenshot(path="jules-scratch/verification/verification_error.png")
        # Re-raise the exception to make it clear the script failed
        raise

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_usage_stats(page)
            print("Verification script completed successfully.")
        finally:
            browser.close()

if __name__ == "__main__":
    main()