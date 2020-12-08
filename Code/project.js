///////////////////////////////////////////////////////////////////////////
// project.js - Javascript file to implement choropleth map for Covid data
//
// Author 	: Ashwini Kurady
// Date		: Dec 8, 2020
// Email		: ashwini.kurady@email.arizona.edu 
///////////////////////////////////////////////////////////////////////////
// 
// Beginning of script
//
///////////////////////////////////////////////////////////////////////////


// Set the width and height for the svg
var width = 800, height = 600, centered;

///////////////////////////////////
// Setting the latest date to pick the Covid related data in order to display on the choropleth map
// Two days prior to latest date is used to ensure that there is buffer for the data to be uploaded in reference

// Reference :  https://www.w3resource.com/javascript-exercises/javascript-basic-exercise-3.php
var today = new Date();
var dd = today.getDate()-2;
if(dd<10) 
{
    dd='0'+dd;
} 

var defDate = today.getFullYear()+"-"+today.getMonth()+"-"+dd;
///////////////////////////////////

///////////////////////////////////

var svg = d3.select("svg");

// Defining the path
var path = d3.geoPath();

// Defining the choropleth map
var covidData= d3.map();

// Set default data to positive cases for mapping
var dataDisp="positive";

var colorDomainMax=0, colorDomainMin=0;
var x = d3.scaleLog()
    	.rangeRound([600, 900]);

///////////////////////////////////
// popScale is set to 1 to show, by default, naive (non-perCapita) data
// popFlag is used to denote this. By default set to 0. Button for perCapita changes the value of this
var popScale=1;
var popFlag=0;

// The range of colors from grey to red.
var color = d3.scaleLinear().range(["grey", "red"]);

var g = svg.append("g").attr("class", "key").attr("transform", "translate(0,40)");

// Creating a tooltip to be used for mouseover
var div = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

///////////////////////////////////
// Defining hash maps for lookup - stateFips will store fips code, state code
// stateNameCode will store state code and state name
// statePop will parse only population data from reference lookup.
// Reference for lookup.csv : https://github.com/aryamanarora/coronavirus/blob/master/data/lookup.csv

var stateFips={};
var stateNameCode={};
var storeData={};
var statePop={};

var promises = [
  	d3.json("https://d3js.org/us-10m.v1.json"),
	d3.csv("stateLookup.csv",function(d){stateNameCode[d.state]=d.name;stateFips[d.state]=d.fips}),
	d3.csv("lookup.csv",function(d){statePop[d.FIPS]=parseInt(d.Population);}),

	// Using herokuapp.com to access csv data from a remote server URL
	// Reference : https://stackoverflow.com/questions/53104881/fetch-api-cannot-load-and-uncaught-in-promise-typeerror-failed-to-fetch-error
  	d3.csv(" https://cors-anywhere.herokuapp.com/covidtracking.com/data/download/all-states-history.csv", function(d) {
	// If the data for a particular state already exists, then append to it, else create a new hash map to store data
		if (covidData.get(stateFips[d.state])) {
                	x = covidData.get(stateFips[d.state])
            	}
            	else {
                	x = {}
			x["state"]=d.state;
            	}
                	x[d.date] = {"positive cases": +d.positive, "negative cases" : +d.negative, "total test results" : +d.totalTestResults, "recovered" : +d.recovered, "deaths": +d.death, "hospitalized" : d.hospitalized};
                	covidData.set(stateFips[d.state], x);
	})];

// Add all the required fields as an array which is the value for each key (state id)

	var margin2 = {top: 20, right: 20, bottom: 100, left: 70},
    	width2 = 250 - margin2.left - margin2.right,
    	height2 = 250 - margin2.top - margin2.bottom;
	var parseTime = d3.timeParse("%Y-%m-%d");


Promise.all(promises).then(ready);

///////////////////////////////////
// Function to plot cumulative graph. Data is the input data (for example positive cases, negative cases etc.)
// printLabel is to print the state name centered. Here, the 3rd graph is used to print the label for state name
// label is the label for each individual plot
// Each of these are passed separately since "data" only contains a hash map of date & number - not state info or any other info.
// Add an id "core" to each of these plots so that on double click, all of these may be cleared.

function plotGraph(data,printLabel,stateName,label)
{
	var x = d3.scaleTime().range([0, width2]);
	var y = d3.scaleLinear().range([height2, 0]);

	var drawLine = d3.line()
    		.x(function(d,i) { return x(parseTime(d.date)); })
    		.y(function(d,i) { return y(d.data); });

	var svg = d3.select("#div2").append("svg")
    		.attr("width", width2 + margin2.left + margin2.right)
    		.attr("height", height2 + margin2.top + margin2.bottom)
      		.attr("id","corr")
  		.append("g")
    		.attr("transform","translate(" + margin2.left + "," + margin2.top + ")");
	
  	x.domain(d3.extent(data, function(d,i) { return  parseTime(d.date)}));
  	y.domain([d3.min(data, function(d,i) { return d.data; }), d3.max(data, function(d,i) { return d.data; })]);

  	svg.append("path")
      		.data([data])
      		.attr("id","corr")
      		.attr("class", "line")
      		.attr("d", drawLine);

  	// Add the X Axis
  	svg.append("g")
      		.attr("class", "axis")
      		.attr("id","corr")
      		.attr("transform", "translate(0," + height2 + ")")
      		.call(d3.axisBottom(x)
              	.tickFormat(d3.timeFormat("%Y-%m-%d")))
      		.selectAll("text")	
        	.style("text-anchor", "end")
        	.attr("dx", "-.8em")
        	.attr("dy", ".15em")
        	.attr("transform", "rotate(-45)");
		svg.append("text")
		    .attr("x", "-.1em" )
		    .attr("y", ".15em")
		    .style("text-anchor", "middle")
		    .text(label)
		    .attr("transform", "translate(70," + (height2+80) + ")")

  	// Add the Y Axis
  	svg.append("g")
      		.attr("class", "axis")
      		.attr("id","corr")
      		.call(d3.axisLeft(y));

	if(printLabel==1)
	{
		svg.append("text")
    			.attr("x", "-.8em" )
    			.attr("y", "1.2em")
    			.style("text-anchor", "middle")
    			.text(stateNameCode[stateName])
    			.attr("transform", "translate(30," + (height2+80) + ")")
			.style("stroke","red")
	}
}
///////////////////////////////////

///////////////////////////////////
// Function to display hover information - details for the particular state on the latest date

function mouseFunc(d) 
{
               
	div.transition().duration(200).style("opacity", 0.9);		
	div.html("State: "+stateNameCode[covidData.get(d.id)["state"]]+"<br/>Number of Positive Cases:"+covidData.get(d.id)[defDate]["positive cases"]+"<br/>Number of Negative Cases: 					"+covidData.get(d.id)[defDate]["negative cases"]+"<br/>Total number of  tests: "+covidData.get(d.id)[defDate]["total test results"]+
	"<br/>Number of Recovered: "+covidData.get(d.id)[defDate]["recovered"]+"<br/>Number of deaths: "+covidData.get(d.id)[defDate]["deaths"]+"<br/>Number of hospitalized patients: "+covidData.get(d.id)[defDate]["hospitalized"])	
        .style("left",  "1000px")		
        .style("top", "150px");	
}
///////////////////////////////////

///////////////////////////////////
// Function to parse the cumulative data for individual state from the total covidData and store in hash map
// This data is then sent to plotGraph function to plot cumulative plots

function clickFunc(d) 
{

	var stateData = {};
	stateData = covidData.get(d.id);
	svg.append("g").attr("class","statesClick");
	var stateHash={};
	var tmpArr=[];

	Object.keys(stateData).forEach(element =>{ if(element != "state"){var tmpHash={}; tmpHash["date"] = element; tmpHash["data"]= stateData[element]["positive cases"]; tmpArr.push(tmpHash)}});
	stateHash.positive = tmpArr;
	var tmpArr=[];
	Object.keys(stateData).forEach(element =>{ if(element != "state"){var tmpHash={}; tmpHash["date"] = element; tmpHash["data"]= stateData[element]["negative cases"]; tmpArr.push(tmpHash)}});
	stateHash.negative = tmpArr;
	var tmpArr=[];
	Object.keys(stateData).forEach(element =>{ if(element != "state"){var tmpHash={}; tmpHash["date"] = element; tmpHash["data"]= stateData[element]["total test results"]; tmpArr.push(tmpHash)}});
	stateHash.tests = tmpArr;
	var tmpArr=[];
	Object.keys(stateData).forEach(element =>{ if(element != "state"){var tmpHash={}; tmpHash["date"] = element; tmpHash["data"]= stateData[element]["deaths"]; tmpArr.push(tmpHash)}});
	stateHash.deaths = tmpArr;
	var tmpArr=[];
	Object.keys(stateData).forEach(element =>{ if(element != "state"){var tmpHash={}; tmpHash["date"] = element; tmpHash["data"]= stateData[element]["recovered"]; tmpArr.push(tmpHash)}});
	stateHash.recovered = tmpArr;

	plotGraph(stateHash.positive,0,covidData.get(d.id)["state"],"Positive cases");
	plotGraph(stateHash.negative,0,covidData.get(d.id)["state"],"Negative cases");
	plotGraph(stateHash.tests,1,covidData.get(d.id)["state"],"Number of tests");
	plotGraph(stateHash.deaths,0,covidData.get(d.id)["state"],"Number of deaths");
	plotGraph(stateHash.recovered,0,covidData.get(d.id)["state"],"Total recovered");

}
///////////////////////////////////

///////////////////////////////////
// Function to draw legend and create a rectangle based color legend
// Color domain is set based on the dataDisp variable

function legendDraw()
{
/// Drawing legend
var legend = svg.append("defs");

var sequential = ["grey", "red"];
legend.append("linearGradient")
	.attr("id", "seqGradient")
	.selectAll("stop") 
	.data(sequential)                  
	.enter().append("stop") 
	.attr("offset", function(d,i) { return i/(sequential.length-1); })   
	.attr("stop-color", function(d) { return d; });

var width=100, height=100;

var legendWidth = 500, legendHeight = 20;

//Color Legend container
var legendsvg = svg.append("g")
	.attr("class", "legendWrapper")
	.attr("transform", "translate(" + (width/2 - 100) + "," + (height+50) + ")");



//Draw the Rectangle
legendsvg.append("rect")
	.attr("class", "legendRect")
	.attr("x", 550)
	.attr("y", -140)
	.attr("width", 255)
	.attr("height", legendHeight)
	.style("fill", "red")
	
//Set scale for x-axis
var xScale = d3.scaleLinear()
	 .range([0, 255])
	 .domain([colorDomainMin,colorDomainMax]);

//Define x-axis
// Reference : https://github.com/d3/d3-format
var xAxis = d3.axisBottom(xScale)
	 .ticks(5).tickFormat(d3.format(".2s"));
if(dataDisp=="negative"||dataDisp=="tests")
{
	xAxis = d3.axisBottom(xScale)
	 .ticks(10).tickFormat(d3.format(".2s"));
}


//Set up X axis
legendsvg.append("g")
	.attr("class", "axis").attr("id","legRect") 
	.attr("transform", "translate(" + (550) + "," + (-120) + ")")
	.call(xAxis);

	svg.selectAll(".legendRect").attr("id","legRect").style("fill", "url(#seqGradient)");
}
///////////////////////////////////

///////////////////////////////////
// Main function which sets the color domain and the data.
// All the mouseover, mouse out, click functions are included here
// Double clicking will clear out all the plots

function ready([us]) {

var tmpPop=[];

// Set a scale popScales based on the state population and map it to 0.5-1. 0.5 being the lowest population state and 1 being highest population state
// This is heuristically chosen and can be tuned to change display of perCapita information

Object.keys(covidData).map(s => s.slice(1)).forEach(el =>tmpPop.push(statePop[el]));
var popScales = d3.scaleLinear().range([0.5,1]).domain(d3.extent(tmpPop));

	colorDomainMax = d3.max(Object.values(covidData).map(function(val){return val[defDate];}).map(function(val){return val["positive cases"];}));
	colorDomainMin = d3.min(Object.values(covidData).map(function(val){return val[defDate];}).map(function(val){return val["positive cases"];}));
	color.domain([colorDomainMin,colorDomainMax]);

 	svg.append("g")
      		.attr("class", "states")
    		.selectAll("path")
    		.data(topojson.feature(us, us.objects.states).features)
    		.enter().append("path")
      		.attr("d", path)
		// Display additional information pertaining to the highlighted state on mouseover
		.on("click", clickFunc)
		.on("mouseover", mouseFunc)
    		.call(d3.zoom().scaleExtent([1, 8]).on("zoom", function () {svg.selectAll('path')
       			.attr("transform", d3.event.transform)
    		})).on("dblclick.zoom", null)
  
		// Fade away the display rectangle on mouseout
		.on("mouseout", function(d) {		
            		div.transition()		
                	.duration(500)		
                	.style("opacity", 0);
           	})   	 	
		.on("dblclick", function(d) {		
			d3.selectAll("#corr").remove();	
           	})   	 	
		// Change the data returned for color coding based on the button pressed using dataDisp variable
      		.attr("fill", function(d) {
			if(popFlag!=0){popScale=popScales(statePop[d.id])};
			switch(dataDisp) {
  				case "positive":
					colorDomainMax = d3.max(Object.values(covidData).map(function(val){return val[defDate];}).map(function(val){return val["positive cases"];}));
					colorDomainMin = d3.min(Object.values(covidData).map(function(val){return val[defDate];}).map(function(val){return val["positive cases"];}));
					color.domain([colorDomainMin,colorDomainMax]);
    					d.color=covidData.get(d.id)[defDate]["positive cases"]/popScale;
        				return color(d.color);
  				case "negative" :
					colorDomainMax = d3.max(Object.values(covidData).map(function(val){return val[defDate];}).map(function(val){return val["negative cases"];}));
					colorDomainMin = d3.min(Object.values(covidData).map(function(val){return val[defDate];}).map(function(val){return val["negative cases"];}));
					color.domain([colorDomainMin,colorDomainMax]);
    					d.color=covidData.get(d.id)[defDate]["negative cases"]/popScale;
        				return color(d.color);
  				case "tests" :
					colorDomainMax = d3.max(Object.values(covidData).map(function(val){return val[defDate];}).map(function(val){return val["total test results"];}));
					colorDomainMin = d3.min(Object.values(covidData).map(function(val){return val[defDate];}).map(function(val){return val["total test results"];}));
					color.domain([colorDomainMin,colorDomainMax]);
    					d.color =covidData.get(d.id)[defDate]["total test results"]/popScale;
        				return color(d.color);
  				case "recovered" :
					colorDomainMax = d3.max(Object.values(covidData).map(function(val){return val[defDate];}).map(function(val){return val["recovered"];}));
					colorDomainMin = d3.min(Object.values(covidData).map(function(val){return val[defDate];}).map(function(val){return val["recovered"];}));
					color.domain([colorDomainMin,colorDomainMax]);
    					d.color =covidData.get(d.id)[defDate]["recovered"]/popScale;
        				return color(d.color);
  				case "deaths" :
					colorDomainMax = d3.max(Object.values(covidData).map(function(val){return val[defDate];}).map(function(val){return val["deaths"];}));
					colorDomainMin = d3.min(Object.values(covidData).map(function(val){return val[defDate];}).map(function(val){return val["deaths"];}));
					color.domain([colorDomainMin,colorDomainMax]);
    					d.color =covidData.get(d.id)[defDate]["deaths"]/popScale;
        				return color(d.color);
  				default:
    					d.color =covidData.get(d.id)[defDate]["positive cases"];
        				return color(d.color);
			}
      		})

	// Display state wise boundaries
  	svg.append("path")
      		.attr("class", "state-borders")
      		.attr("d", path(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; })));
	// Display county wise boundaries
  	svg.append("path")
      		.attr("class", "city-borders")
      		.attr("d", path(topojson.mesh(us, us.objects.counties, function(a, b) { return a !== b; })));

legendDraw();
}

///////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Callbacks for buttons
// Click on the buttons shows the choropleth map sorted by different parameters

d3.select("#positive").on("click", function() {
  	dataDisp="positive";
popFlag=0;
popScale=1;
	d3.selectAll("#legRect").selectAll("*").remove();
Promise.all(promises).then(ready);
});

d3.select("#negative").on("click", function() {
  dataDisp="negative";
popFlag=0;
popScale=1;
	d3.selectAll("#legRect").selectAll("*").remove();
Promise.all(promises).then(ready);
});

d3.select("#recovered").on("click", function() {
  dataDisp="recovered";
popFlag=0;
popScale=1;
	d3.selectAll("#legRect").selectAll("*").remove();
Promise.all(promises).then(ready);
});

d3.select("#tests").on("click", function() {
  dataDisp="tests";
popFlag=0;
popScale=1;
	d3.selectAll("#legRect").selectAll("*").remove();
Promise.all(promises).then(ready);
});
d3.select("#deaths").on("click", function() {
  dataDisp="deaths";
popFlag=0;
popScale=1;
	d3.selectAll("#legRect").selectAll("*").remove();
Promise.all(promises).then(ready);
});
d3.select("#perCapita").on("click", function() {
  popFlag=1;
	d3.selectAll("#legRect").selectAll("*").remove();
Promise.all(promises).then(ready);
});

