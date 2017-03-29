let express = require("express")
let app = express()
let http = require("http")
let fs = require("fs")

let Mustache = require("mustache")

let path = require("path")

let request = require("request")

app.use("/static", express.static("static"))

let server = http.createServer(app).listen(8080, function () {
	console.log("HTTP server listening.");
})

// how long to cache Github results
const CACHE_TIME = 1000 * 60 * 3 // three minutes
// how many recent commits to fetch
const FETCH_COUNT = 3
let githubLastUpdated = 0
let githubCache = {
	commits: [],
}

fetchGithub(()=>{})

app.get("/", (req, res) => {
	fetchGithub((commits, error = null) => {
		res.send(
			Mustache.to_html(
				fs.readFileSync(path.join(__dirname, "index.html")).toString(),
				{
					year: new Date().getFullYear(),
					commits: commits,
				}
			)
		)
	})
})

function fetchGithub(callback) {
	// implement very simple caching
	if(Date.now() - githubLastUpdated < CACHE_TIME) {
		console.log("Serving from cache.")

		callback(githubCache.commits)
		return
	}

	// otherwise, fetch fresh data, cache, and serve
	console.log("Fetching fresh GitHub data.")
	request.get({
		url: "https://api.github.com/users/kevwu/events",
		headers: {
			'User-Agent': 'kevwu-kwu-site'
		}
	}, (error, response, body) => {
		if (error !== null || response.statusCode !== 200) {
			console.log("Error occurred, serving from cache instead.")
			console.log(error)

			callback(null, error)
			return
		}

		githubRaw = JSON.parse(body)
		let commits = []

		for(let i = 0; i < githubRaw.length; i += 1) {
			let event = githubRaw[i]
			if(event.type !== "PushEvent") {
				continue
			}

			for(let c = 0; c < event.payload.commits.length; c += 1) {
				let commit = event.payload.commits[c]
				commit.timestamp = event.created_at
				commit.repository = event.repo.name

				commits.push(commit)
			}
		}

		commits = commits.slice(0,FETCH_COUNT)

		githubCache.commits = commits
		githubLastUpdated = Date.now()
		callback(commits)
	})
}
