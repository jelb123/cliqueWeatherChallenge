$(document).ready(function() {
	var ratings = [0, 0, 0, 0, 0]
	for (rating of ratingsArr) {
		ratings[rating.rating-1] = rating.count;
	}

	var ctx = document.getElementById('ratingsChart').getContext('2d');
	console.log(ratings)
	var myBarChart = new Chart(ctx, {
	    type: 'bar',
	    data: {
			labels: ['1', '2', '3', '4', '5'],
			xAxisID: 'Rating',
			yAxisID: 'Count',
			datasets: [
				{
					label: "Ratings Given",
					data: ratings,
					backgroundColor: [
						"rgba(255, 99, 132, 0.2)",
						"rgba(255, 159, 64, 0.2)",
						"rgba(255, 205, 86, 0.2)",
						"rgba(75, 192, 192, 0.2)",
						"rgba(54, 162, 235, 0.2)"
					],
					borderColor: [
						"rgb(255, 99, 132)",
						"rgb(255, 159, 64)",
						"rgb(255, 205, 86)",
						"rgb(75, 192, 192)",
						"rgb(54, 162, 235)"
					],
					borderWidth: 1
				}
			]
		},
		options: {
			scales: {
				yAxes: [
					{
						ticks: {
							beginAtZero: true
						}
					}
				]
			}
		}
	})
})
