let express = require("express")
let app = express()
let http = require("http")
let fs = require("fs")

let Mustache = require("mustache")

let path = require("path")

let Bluebird = require("bluebird")
let rp = require("request-promise")

app.use("/static", express.static("static"))

let server = http.createServer(app).listen(8080, function () {
	console.log("HTTP server listening.");
})

// how long to cache Github results
const CACHE_TIME = 1000 * 60 * 3 // three minutes
// how many recent commits to fetch
const FETCH_COUNT = 4
let githubLastUpdated = 0
let githubCache = {
	commits: [],
}

fetchGithub(()=>{})

app.get("/", (req, res) => {
	fetchGithub((commits, error = false) => {
		res.send(
			Mustache.to_html(
				fs.readFileSync(path.join(__dirname, "index.html")).toString(),
				{
					year: new Date().getFullYear(),
					commits: commits,
					error: error,
				}
			)
		)
	})
})

function fetchGithub(callback) {
	// implement very simple caching
	if( (Date.now() - githubLastUpdated) < CACHE_TIME) {
		console.log("Serving from cache.")

		callback(githubCache.commits)
		return
	}

	// otherwise, fetch fresh data, cache, and serve
	console.log("Fetching fresh GitHub data.")
	rp({
		url: "https://api.github.com/users/kevwu/events",
		headers: {
			'User-Agent': 'kevwu-kwu-site'
		}
	}, (error, response, body) => {
		if (error !== null || response.statusCode !== 200) {
			console.log("Error occurred, serving from cache instead.")
			console.log(error)
			console.log(response.body)

			callback(null, true)
			return
		}

		let events = JSON.parse(body)
		let commits = []
		let commitPromises = []
		let commitCount = 0

		events.filter((event) => {
			return event.type === "PushEvent"
		}).forEach((event, i) => {
			event.payload.commits.forEach((commit) => {
				if(commitCount >= FETCH_COUNT) {
					return
				}

				commitPromises.push(rp({
					url: commit.url,
					headers: {
						'User-Agent': 'kevwu-kwu-site'
					}
				}))
				commitCount += 1
			})
		})

		Bluebird.all(commitPromises).spread((...results) => {
			results.forEach((commit) => {
				commit = JSON.parse(commit)
				commits.push({
					date: commit.commit.author.date,
					relaTime: relativeTime(Date.now(), new Date(commit.commit.author.date).getTime()),
					message: commit.commit.message,
					additions: commit.stats.additions,
					deletions: commit.stats.deletions,
					url: commit.html_url,
					repository: commit.html_url.substring(0,commit.html_url.indexOf("/commit/")).replace("https://github.com/", "")
				})
			})

			commits.sort((a, b) => {
				return (new Date(b.date).getTime()) - (new Date(a.date).getTime());
			})
			console.log(commits)

			githubCache.commits = commits
			githubLastUpdated = Date.now()
			callback(commits)
		})
	})
}

function relativeTime(current, previous) {
	const msPerMinute = 60 * 1000
	const msPerHour = msPerMinute * 60
	const msPerDay = msPerHour * 24
	const msPerMonth = msPerDay * 30
	const msPerYear = msPerDay * 365

	let elapsed = current - previous

	let delta
	let unitString

	if (elapsed < msPerMinute) {
		return "a few seconds ago"
	}
	else if (elapsed < msPerHour) {
		delta = Math.round(elapsed / msPerMinute)
		unitString = (delta === 1) ? "minute" : "minutes"
	}
	else if (elapsed < msPerDay) {
		delta = Math.round(elapsed / msPerHour)
		unitString = (delta === 1) ? "hour" : "hours"
	}
	else if (elapsed < msPerMonth) {
		delta = Math.round(elapsed / msPerDay)
		unitString = (delta === 1) ? "day" : "days"

	}
	else if (elapsed < msPerYear) {
		delta = Math.round(elapsed / msPerMonth)
		unitString = (delta === 1) ? "month" : "months"
	}
	else {
		delta = Math.round(elapsed / msPerYear)
		unitString = (delta === 1) ? "year" : "years"
	}

	return delta + " " + unitString + " ago"
}