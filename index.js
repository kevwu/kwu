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
const CACHE_TIME = 1000 * 60 * 5 // five minutes
// how many recent commits to fetch
const FETCH_COUNT = 5
let githubLastUpdated = 0
let githubCache = {
	commits: [],
}

fetchGithub(()=>{})

app.get("/", (req, res) => {
	fetchGithub((githubData, error = null) => {
		console.log(githubData)

		res.send(
			Mustache.to_html(
				fs.readFileSync(path.join(__dirname, "index.html")).toString(),
				{
					year: new Date().getFullYear(),
				}
			)
		)
	})
})

function fetchGithub(callback) {
	// implement very simple caching
	if(Date.now() - githubLastUpdated < CACHE_TIME) {
		console.log("Serving from cache.")
		// cache has not yet expired, just serve from that

		callback(githubCache.commits)
		return
	}

	// otherwise, fetch fresh data, cache, and serve
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

			commits = commits.concat(event.payload.commits)
		}

		console.log(commits)


		githubLastUpdated = Date.now()
		callback(commits)
	})
}