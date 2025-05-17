export function drawSkillsBarChart(skillsData, chartTitle = "Skills", containerId = "skills-chart") {
    if (!skillsData?.length) return;

    // Sort skills by amount descending
    const sortedSkills = [...skillsData].sort((a, b) => b.amount - a.amount);

    const maxAmount = Math.max(...sortedSkills.map(d => d.amount));
    const svgNS = "http://www.w3.org/2000/svg";
    const barHeight = 25, gap = 10, width = 800;
    const height = Math.min(sortedSkills.length * (barHeight + gap), 600);

    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);

    sortedSkills.forEach((item, i) => {
        const y = i * (barHeight + gap);
        const barWidth = maxAmount ? (item.amount / maxAmount) * (width - 160) : 0;

        // Bar
        const rect = document.createElementNS(svgNS, "rect");
        rect.setAttribute("x", 100);
        rect.setAttribute("y", y);
        rect.setAttribute("width", barWidth);
        rect.setAttribute("height", barHeight);
        rect.setAttribute("class", "skill-bar");
        svg.appendChild(rect);

        // Skill label
        const label = document.createElementNS(svgNS, "text");
        label.setAttribute("x", 0);
        label.setAttribute("y", y + 15);
        label.textContent = item.type.replace("skill_", "");
        label.setAttribute("class", "skill-label");
        svg.appendChild(label);

        // Value label
        const valueLabel = document.createElementNS(svgNS, "text");
        valueLabel.setAttribute("x", 100 + barWidth + 5);
        valueLabel.setAttribute("y", y + barHeight / 2 + 4);
        valueLabel.textContent = `${item.amount.toLocaleString()}%`;
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
    titleElement.textContent = chartTitle;
    titleElement.className = "chart-title";
    scrollWrapper.appendChild(titleElement);
    scrollWrapper.appendChild(svg);
    chartContainer.appendChild(scrollWrapper);
}

const XPLineColors = {
    Line: "#fdba74", // Pastel coral
    Dot: "#fdba74", // Pastel coral
    Axis: "#d1d5db", // Soft gray
    Grid: "#e5e7eb" // Lighter gray
};

export function drawXPLineGraph(xpProgression, chartTitle = "XP Progression", containerId = "xp-graph") {
    if (!xpProgression?.length) return;

    const svgNS = "http://www.w3.org/2000/svg";
    const width = 800, height = 300, padding = 80;
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);

    // Compute exponential-like values: y = totalXP * (1 - exp(-k * t))
    const totalXP = xpProgression[xpProgression.length - 1].amount;
    const k = 5; // Controls steepness of exponential curve
    const expData = xpProgression.map((d, i) => {
        const t = i / (xpProgression.length - 1); // Normalize time to [0, 1]
        const expValue = totalXP * (1 - Math.exp(-k * t));
        return { ...d, amount: expValue };
    });

    // Scaling
    const maxXP = Math.ceil(totalXP / 100000) * 100000 || 100000;
    const xScale = i => i * (width - 2 * padding) / (expData.length - 1) + padding;
    const yScale = xp => height - padding - (xp / maxXP) * (height - 2 * padding);

    // Axes
    [
        [padding, padding, padding, height - padding], // Y
        [padding, height - padding, width - padding, height - padding] // X
    ].forEach(([x1, y1, x2, y2]) => {
        const axis = document.createElementNS(svgNS, "line");
        axis.setAttribute("x1", x1); axis.setAttribute("y1", y1);
        axis.setAttribute("x2", x2); axis.setAttribute("y2", y2);
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
    };

    // X labels
    const labelStep = Math.ceil(expData.length / 6);
    for (let i = 0; i < expData.length; i += labelStep) {
        const x = xScale(i);
        const date = new Date(expData[i].createdAt);
        const label = `${date.getMonth() + 1}/${date.getFullYear() % 100}`;
        const text = document.createElementNS(svgNS, "text");
        text.setAttribute("x", x);
        text.setAttribute("y", height - padding + 20);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-size", "12");
        text.textContent = label;
        svg.appendChild(text);
    };

    // Line path
    let pathData = `M ${xScale(0)} ${yScale(expData[0].amount)} `;
    for (let i = 1; i < expData.length; i++) {
        pathData += `L ${xScale(i)} ${yScale(expData[i].amount)} `;
    }
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", pathData);
    path.setAttribute("stroke", XPLineColors.Line);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-width", 2);
    svg.appendChild(path);

    // Dots with hover tooltip
    for (let i = 0; i < expData.length; i++) {
        const circle = document.createElementNS(svgNS, "circle");
        circle.setAttribute("cx", xScale(i));
        circle.setAttribute("cy", yScale(expData[i].amount));
        circle.setAttribute("r", 5);
        circle.setAttribute("fill", XPLineColors.Dot);
        circle.setAttribute("stroke", "#ffffff");
        circle.setAttribute("stroke-width", "2");

        // Extract project name from path
        const path = expData[i].path || "Unknown Project";
        const projectName = path.split("/").pop() || "Unknown Project";

        // Add tooltip on hover with only the project name
        const title = document.createElementNS(svgNS, "title");
        title.textContent = projectName;
        circle.appendChild(title);

        svg.appendChild(circle);
    }

    // Insert SVG into the container with a title
    const chartContainer = document.getElementById(containerId);
    if (!chartContainer) {
        console.warn(`Container with ID ${containerId} not found`);
        return;
    }
    chartContainer.innerHTML = "";
    const scrollWrapper = document.createElement("div");
    scrollWrapper.className = "chart-scroll-wrapper";
    const titleElement = document.createElement("h3");
    titleElement.textContent = chartTitle;
    titleElement.className = "chart-title";
    scrollWrapper.appendChild(titleElement);
    scrollWrapper.appendChild(svg);
    chartContainer.appendChild(scrollWrapper);
}