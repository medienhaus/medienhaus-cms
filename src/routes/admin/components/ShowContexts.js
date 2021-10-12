
import React from 'react'
import * as d3 from 'd3'
import bingo from '../../../assets/data/dummyData.json'

export function ShowContexts (props) {
  const MultilineChart = () => {
    const svgRef = React.useRef(null)

    const width = 932
    const height = 932

    const color = d3.scaleLinear()
      .domain([0, 5])
      .range(['hsl(152,80%,80%)', 'hsl(228,30%,40%)'])
      .interpolate(d3.interpolateHcl)

    const pack = data => d3.pack()
      .size([width, height])
      .padding(3)(d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value))

    const root = pack(bingo)
    let focus = root
    let view

    const svg = d3.create('svg')
      .attr('viewBox', `-${width / 2} -${height / 2} ${width} ${height}`)
      .style('display', 'block')
      .style('margin', '0 -14px')
      .style('background', color(0))
      .style('cursor', 'pointer')
      .on('click', (event) => zoom(event, root))

    const node = svg.append('g')
      .selectAll('circle')
      .data(root.descendants().slice(1))
      .join('circle')
      .attr('fill', 'white')
      .attr('fill-opacity', '0')
      .attr('stroke', 'black')
      .on('mouseover', function () { d3.select(this).attr('fill-opacity', '1') })
      .on('mouseout', function () { d3.select(this).attr('fill-opacity', '0') })
      .on('click', (event, d) => {
        console.log(d)
        return focus !== d && (zoom(event, d), event.stopPropagation())
      })

    const label = svg.append('g')
      .style('font', '10px sans-serif')
      .attr('fill', 'black')
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .selectAll('text')
      .data(root.descendants())
      .join('text')
      .style('fill-opacity', d => d.parent === root ? 1 : 0)
      .style('display', d => d.parent === root ? 'inline' : 'none')
      .text(d => d.data.name)

    zoomTo([root.x, root.y, root.r * 2])

    function zoomTo (v) {
      const k = width / v[2]

      view = v

      label.attr('transform', d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`)
      node.attr('transform', d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`)
      node.attr('r', d => d.r * k)
    }

    function zoom (event, d) {
      focus = d

      const transition = svg.transition()
        .duration(event.altKey ? 7500 : 750)
        .tween('zoom', d => {
          const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2])
          return t => zoomTo(i(t))
        })

      label
        .filter(function (d) { return d.parent === focus || this.style.display === 'inline' })
        .transition(transition)
        .style('fill-opacity', d => d.parent === focus ? 1 : 0)
        .on('start', function (d) { if (d.parent === focus) this.style.display = 'inline' })
        .on('end', function (d) { if (d.parent !== focus) this.style.display = 'none' })
    }

    React.useEffect(() => {
      if (svgRef.current) {
        svgRef.current.appendChild(svg.node())
      }
    }, [node, svg])
    return <svg ref={svgRef} />
  }

  return (
    <MultilineChart />
  )
}

export default ShowContexts
