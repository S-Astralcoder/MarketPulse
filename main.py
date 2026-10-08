from uvicorn import run

def main():
    run(app="src.app:app", host="localhost", port=8000, reload=True)

if __name__ == "__main__":
    main()
