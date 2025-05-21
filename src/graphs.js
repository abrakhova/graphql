const XPLineColors = {
    Line: "#DB0F16", // --accent
    Dot: "#DB0F16", // --accent
    Axis: "#333333", // Dark gray
    Grid: "#666666" // Medium gray
  };
  
  export function drawXPLineGraph(xpProgression, containerId = "xp-graph") {
  if (!xpProgression?.length) return;

  const svgNS = "http://www.w3.org/2000/svg";
  const width = 800, height = 300, padding = 80;
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);

  // Get min and max dates for x-axis scaling
  const dates = xpProgression.map(p => new Date(p.createdAt).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const dateRange = maxDate - minDate || 1; // Avoid division by zero

  // X-axis scale based on time
  const xScale = (date) => {
    const time = new Date(date).getTime();
    return padding + ((time - minDate) / dateRange) * (width - 2 * padding);
  };

  // Y-axis scale
  const totalXP = xpProgression[xpProgression.length - 1]?.cumulativeAmount || 100000;
  const maxXP = Math.ceil(totalXP / 100000) * 100000 || 100000;
  const yScale = xp => height - padding - (xp / maxXP) * (height - 2 * padding);

  // Axes
  [
    [padding, padding, padding, height - padding], // Y
    [padding, height - padding, width - padding, height - padding] // X
  ].forEach(([x1, y1, x2, y2]) => {
    const axis = document.createElementNS(svgNS, "line");
    axis.setAttribute("x1", x1);
    axis.setAttribute("y1", y1);
    axis.setAttribute("x2", x2);
    axis.setAttribute("y2", y2);
    axis.setAttribute("stroke", XPLineColors.Axis);
    svg.appendChild(axis);
  });

  // Grid lines and Y labels
  const tickStep = 100000, maxTicks = Math.ceil(maxXP / tickStep);
  for (let i = 0; i <= maxTicks; i++) {
    const value = i * tickStep, y = yScale(value);
    const grid = document.createElementNS(svgNS, "line");
    grid.setAttribute("x1", padding);
    grid.setAttribute("y1", y);
    grid.setAttribute("x2", width - padding);
    grid.setAttribute("y2", y);
    grid.setAttribute("stroke", XPLineColors.Grid);
    grid.setAttribute("stroke-dasharray", "2,2");
    svg.appendChild(grid);
    const label = document.createElementNS(svgNS, "text");
    label.setAttribute("x", padding - 10);
    label.setAttribute("y", y + 4);
    label.setAttribute("text-anchor", "end");
    label.setAttribute("font-size", "12");
    label.textContent = value.toLocaleString();
    svg.appendChild(label);
  }

  // X labels (time-based, ~12 labels)
  const labelCount = 12;
  const timeStep = dateRange / (labelCount - 1);
  for (let i = 0; i < labelCount; i++) {
    const time = minDate + i * timeStep;
    const date = new Date(time);
    const label = `${date.getMonth() + 1}/${date.getFullYear() % 100}`;
    const x = xScale(time);
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", x);
    text.setAttribute("y", height - padding + 20);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "12");
    text.textContent = label;
    svg.appendChild(text);
  }

  // Line path
  let pathData = `M ${xScale(xpProgression[0].createdAt)} ${yScale(xpProgression[0].cumulativeAmount)} `;
  for (let i = 1; i < xpProgression.length; i++) {
    pathData += `L ${xScale(xpProgression[i].createdAt)} ${yScale(xpProgression[i].cumulativeAmount)} `;
  }
  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("d", pathData);
  path.setAttribute("stroke", XPLineColors.Line);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke-width", 2);
  svg.appendChild(path);

  // Dots with hover tooltip (include individual project XP)
  for (let i = 0; i < xpProgression.length; i++) {
    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("cx", xScale(xpProgression[i].createdAt));
    circle.setAttribute("cy", yScale(xpProgression[i].cumulativeAmount));
    circle.setAttribute("r", 5);
    circle.setAttribute("fill", XPLineColors.Dot);
    circle.setAttribute("stroke", "#ffffff");
    circle.setAttribute("stroke-width", "2");

    const path = xpProgression[i].path || "Unknown Project";
    const projectName = path.split("/").pop() || "Unknown Project";
    const date = new Date(xpProgression[i].createdAt);
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    const projectXP = xpProgression[i].projectAmount;

    const title = document.createElementNS(svgNS, "title");
    title.textContent = `${formattedDate}: ${projectName} (${projectXP.toLocaleString()} XP)`;
    circle.appendChild(title);

    svg.appendChild(circle);
  }

  // Insert SVG into the container
  const chartContainer = document.getElementById(containerId);
  if (!chartContainer) {
    console.warn(`Container with ID ${containerId} not found`);
    return;
  }
  chartContainer.innerHTML = "";
  const scrollWrapper = document.createElement("div");
  scrollWrapper.className = "chart-scroll-wrapper";
  const titleElement = document.createElement("h3");
  scrollWrapper.appendChild(titleElement);
  scrollWrapper.appendChild(svg);
  chartContainer.appendChild(scrollWrapper);
}
  
  export function drawSkillsBarChart(skillsData, containerId = "skills-chart") {
    if (!skillsData?.length) return;
  
    const sortedSkills = [...skillsData].sort((a, b) => b.amount - a.amount);
  
    const svgNS = "http://www.w3.org/2000/svg";
    const barHeight = 25, gap = 10, width = 800;
    const height = Math.min(sortedSkills.length * (barHeight + gap), 600);
    const maxSkill = 100;
  
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
  
    sortedSkills.forEach((item, i) => {
      const y = i * (barHeight + gap);
      const percentage = Math.min((item.amount / maxSkill) * 100, 100);
      const filledWidth = (percentage / 100) * (width - 160);
  
      const bgRect = document.createElementNS(svgNS, "rect");
      bgRect.setAttribute("x", 100);
      bgRect.setAttribute("y", y);
      bgRect.setAttribute("width", width - 160);
      bgRect.setAttribute("height", barHeight);
      bgRect.setAttribute("fill", "#e5e7eb");
      svg.appendChild(bgRect);
  
      const fgRect = document.createElementNS(svgNS, "rect");
      fgRect.setAttribute("x", 100);
      fgRect.setAttribute("y", y);
      fgRect.setAttribute("width", filledWidth);
      fgRect.setAttribute("height", barHeight);
      fgRect.setAttribute("fill", "#FFD300"); // --secondary
      svg.appendChild(fgRect);
  
      const label = document.createElementNS(svgNS, "text");
      label.setAttribute("x", 0);
      label.setAttribute("y", y + 15);
      label.textContent = item.type.replace("skill_", "");
      label.setAttribute("class", "skill-label");
      svg.appendChild(label);
  
      const valueLabel = document.createElementNS(svgNS, "text");
      valueLabel.setAttribute("x", 100 + filledWidth + 5);
      valueLabel.setAttribute("y", y + barHeight / 2 + 4);
      valueLabel.textContent = `${percentage.toFixed(1)}%`;
      valueLabel.setAttribute("class", "skill-value");
      svg.appendChild(valueLabel);
    });
  
    const chartContainer = document.getElementById(containerId);
    if (!chartContainer) {
      console.warn(`Container with ID ${containerId} not found`);
      return;
    }
    chartContainer.innerHTML = "";
  
    const scrollWrapper = document.createElement("div");
    scrollWrapper.className = "chart-scroll-wrapper";
  
    const titleElement = document.createElement("h3");
    scrollWrapper.appendChild(titleElement);
    scrollWrapper.appendChild(svg);
    chartContainer.appendChild(scrollWrapper);
  }