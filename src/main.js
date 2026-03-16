d3.select('#datavis_header')
.style('color','red')
.text('Istanbul Population vs Economic Indicators');

const margin = {top:50, bottom:60, left:80, right:80};
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const svg = d3.select('#chart')
.attr('width', width + margin.left + margin.right)
.attr('height', height + margin.top + margin.bottom)
.append('g')
.attr('transform', `translate(${margin.left}, ${margin.top})`);

Promise.all([
  d3.csv('./src/SampleDataTürkiyeCensus.csv'),
  d3.csv('./src/inflation.csv'),
  d3.csv('./src/GDP_per_capita.csv'),
  d3.csv('./src/life_expectancy.csv')
]).then(([pop, inflation, gdp, life]) => {

  const populationData = pop.map(d => ({
    year: +d.Zaman,
    population: +d["İstanbul"].replace(/,/g,"")
  }));

  const inflationData = inflation.map(d => ({
    year: +d.observation_date.substring(0,4),
    inflation: +d.FPCPITOTLZGTUR
  }));

  const gdpData = gdp.map(d => ({
    year: +d.observation_date.substring(0,4),
    gdp: +d.PCAGDPTRA646NWDB
  }));

  const lifeData = life.map(d => ({
    year: +d.observation_date.substring(0,4),
    lifeExp: +d.SPDYNLE00INTUR
  }));

  const merged = populationData
  .filter(d => d.year >= 1960)
  .map(p => {

    const infl = inflationData.find(d => d.year === p.year);
    const g = gdpData.find(d => d.year === p.year);
    const l = lifeData.find(d => d.year === p.year);

    return {
      year: p.year,
      population: p.population,
      inflation: infl ? infl.inflation : null,
      gdp: g ? g.gdp : null,
      lifeExp: l ? l.lifeExp : null
    };

  });

  const data = merged
  .filter(d => d.year >= 1960 && d.year <= 2024)
  .filter(d => d.year % 5 === 0 || d.year >= 2022)
  .sort((a,b) => a.year - b.year);

  console.log(data);

  const x = d3.scaleBand()
  .domain(data.map(d => d.year))
  .range([0,width])
  .padding(0.2);

  const y = d3.scaleLinear()
  .domain([0, d3.max(data,d=>d.population)])
  .range([height,0]);

  const lifeScale = d3.scaleLinear()
  .domain(d3.extent(data,d=>d.lifeExp))
  .range([height,0]);

  const color = d3.scaleSequential()
  .domain(d3.extent(data,d=>d.inflation))
  .interpolator(d3.interpolateOrRd);


  svg.append('g')
  .attr('transform',`translate(0,${height})`)
  .call(d3.axisBottom(x));

  svg.append('g')
  .call(d3.axisLeft(y));

  svg.append('g')
  .attr('transform',`translate(${width},0)`)
  .call(d3.axisRight(lifeScale));

  svg.selectAll('rect')
  .data(data)
  .enter()
  .append('rect')
  .attr('x', d => x(d.year))
  .attr('y', d => y(d.population))
  .attr('width', x.bandwidth())
  .attr('height', d => height - y(d.population))
  .attr('fill', d => color(d.inflation));

  svg.selectAll('.label')
  .data(data)
  .enter()
  .append('text')
  .attr('x', d => x(d.year) + x.bandwidth()/2)
  .attr('y', d => y(d.population)-5)
  .attr('text-anchor','middle')
  .style('font-size','10px')
  .text(d => "$" + Math.round(d.gdp));

  const line = d3.line()
  .x(d => x(d.year) + x.bandwidth()/2)
  .y(d => lifeScale(d.lifeExp));

  svg.append('path')
  .datum(data)
  .attr('fill','none')
  .attr('stroke','blue')
  .attr('stroke-width',2)
  .attr('d', line);

});
