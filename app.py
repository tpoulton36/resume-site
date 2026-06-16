from flask import Flask, render_template
from database import get_projects, get_algorithms

app = Flask(__name__)


@app.route("/")
def home():
    projects = get_projects()
    return render_template("index.html", projects=projects)


@app.route("/algorithms")
def algorithms():
    algorithm_list = get_algorithms()
    return render_template("algorithms.html", algorithms=algorithm_list)

@app.route("/eportfolio")
def eportfolio():
    return render_template("eportfolio.html")

if __name__ == "__main__":
    app.run(debug=True)