export function renderXPLineGraph(data) {
  const svg = d3.select('#xp-line-graph').attr('width', 400).attr('height', 200);
  svg.selectAll('*').remove(); // Clear previous render
  const margin = { top: 20, right: 20, bottom: 30, left: 50 };
  const width = 400 - margin.left - margin.right;
  const height = 200 - margin.top - margin.bottom;

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.amount)])
    .range([height, 0]);

  const line = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.amount));

  g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 2)
    .attr('d', line);

  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5));

  g.append('g')
    .call(d3.axisLeft(y).ticks(5));
}

export function renderPassFailPieChart(passCount, failCount) {
  const svg = d3.select('#pass-fail-pie').attr('width', 200).attr('height', 200);
  svg.selectAll('*').remove(); // Clear previous render
  const radius = 100;
  const g = svg.append('g').attr('transform', `translate(${radius},${radius})`);

  const pie = d3.pie()([passCount, failCount]);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);

  g.selectAll('path')
    .data(pie)
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', (d, i) => (i === 0 ? 'green' : 'red'))
    .on('mouseover', function () {
      d3.select(this).attr('opacity', 0.7);
    })
    .on('mouseout', function () {
      d3.select(this).attr('opacity', 1);
    });

  g.selectAll('text')
    .data(pie)
    .enter()
    .append('text')
    .attr('transform', d => `translate(${arc.centroid(d)})`)
    .attr('dy', '.35em')
    .attr('text-anchor', 'middle')
    .text((d, i) => (i === 0 ? `Pass: ${passCount}` : `Fail: ${failCount}`));
}