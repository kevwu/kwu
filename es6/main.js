$(() => {
	$(".status-commit").each(function () {
		let $this = $(this)

		$.ajax(
			$this.data("url"),
			{
				success: (result) => {
					$this.find(".status-commit-relatime").text(relativeTime(Date.now(), new Date(result.commit.committer.date).getTime()))
					$this.find(".status-commit-diff-added").text(result.stats.additions)
					$this.find(".status-commit-diff-removed").text(result.stats.deletions)
				},
				error: (jqxhr, status, error) => {
					// silently fail
					$this.find(".status-commit-diff").hide()
				}
			}
		)
	})

	// Borrowed from Stack Overflow. Less pretty, but still faster than loading in moment.js
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
})

