import base64
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_FILE = os.path.join(BASE_DIR, "data.xlsx")
OUTPUT_FILE = os.path.join(BASE_DIR, "data_base64.txt")

def generate_base64():
    if not os.path.exists(INPUT_FILE):
        print(f"Error: {INPUT_FILE} not found!")
        return

    with open(INPUT_FILE, "rb") as f:
        encoded_string = base64.b64encode(f.read()).decode('utf-8')

    with open(OUTPUT_FILE, "w") as f:
        f.write(encoded_string)
    
    print(f"Success! Base64 string saved to: {OUTPUT_FILE}")
    print("Copy the contents of this file and paste it into your Render/Railway Environment Variables as 'DATA_BASE64'.")

if __name__ == "__main__":
    generate_base64()
