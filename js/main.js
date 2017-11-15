var IS_MOBILE = d3.select("#isMobile").style("display") == "block";
var IS_PHONE = d3.select("#isPhone").style("display") == "block";
var BREAKS ={"perc_debt_collect":[0.22, .31, .39, .49], "med_debt_collect":[1200, 1500, 1800, 2300], "perc_debt_med":[.11,.18,.26,.34], "med_debt_med":[500,700,950,1250], "perc_pop_nw":[.13,.28,.46,.67], "perc_pop_no_ins":[.08,.13,.18,.26], "avg_income":[52650,63850,77900,101050]}
var SELECTED_VARIABLE;
var WHITE;
var NONWHITE;
var COLORRANGE = ["#cfe8f3", "#73bfe2","#1696d2", "#0a4c6a", "#000000"];
var zoomState;
var zoomNational;
var zoomCounty;
var CATEGORY = "medical";
var tdMap;
// var margin = (IS_PHONE) ? {top: 10, right: 30, bottom: 10, left: 30} : {top: 10, right: 31, bottom: 10, left: 55}

var dropdown;
function setWidth(width) { 
  var margin = (IS_PHONE) ? {top: 10, right: 30, bottom: 10, left: 30} : {top: 10, right: 31, bottom: 10, left: 55};
  console.log(margin.left)
  if ($("body").width() > 1200) {
    tdMap = 870 - margin.right - margin.left
  }else if ($("body").width() <= 1200 && !IS_MOBILE){ 
    tdMap = width - margin.right -margin.left
  }else if (IS_MOBILE && !IS_PHONE) { 
    tdMap = width
  }else if (IS_PHONE) {
    tdMap = width - margin.right -margin.left
  }
}
function setVariable(variable) {
  SELECTED_VARIABLE = variable;
  WHITE = variable + "_wh"
  NONWHITE= variable + "_nw"
}
function setZoom(national, state, county) {
  zoomNational = national;
  zoomState = state;
  zoomCounty = county;
}

function selectedStatePh() {

}
var initialWidth = (IS_PHONE) ? $('body').width() : $("body").width() - $(".td-table").width()
setWidth(initialWidth)
setZoom(true,false, false)
setVariable("perc_debt_collect")
var width =  tdMap,  //(IS_MOBILE && !IS_PHONE) ? tdMap : (tdMap) - margin.right-margin.left,
    height = (IS_PHONE) ? (width) - margin.top-margin.bottom :  630,//(width*.57) - margin.top-margin.bottom,     
    centered,
    selectedState,
    selectedStatePh,
    selectedCountyPh
// d3.json("https://d3js.org/us-10m.v1.json", function(error, us) {
//   if (error) throw error;
d3.queue()
    .defer(d3.json, "https://d3js.org/us-10m.v1.json")
    .defer(d3.csv, "data/county_" + CATEGORY + "2.csv")
    .defer(d3.csv, "data/state_"+ CATEGORY + ".csv")
    .await(ready);

function transformData(geography){
  var geography_nested = d3.nest()
    .key(function(d) {return d.id })
    .entries(geography);
  return geography_nested
}


function ready(error, us, county, state) {
  if (error) throw error;
  /*SETTING UP THE DATA*/
  var countyData = us.objects.counties.geometries
  var stateData = us.objects.states.geometries

  var county_data = transformData(county)
    county_data.forEach(function(d,i){ 
      for (var property in d["values"][0]) {
        d[property] = d.values[0][property]
      }
      countyData.forEach(function(e, j) { 
        if (d.key == e.id) { 
          for (var property in d["values"][0]) { 
            if (property == "county") {
            }
          //   if ((d.values[0][property]).search('<') > 0 && property != "state" && property != "abbr" && property != "county") {
          //     console.log(d.values[0][property])
          //     e[property] == "n<50"
          // //  if (isNaN(+d.values[0][property]) == true && property != "state" && property != "abbr" && property != "county") {
          //     // e[property] == null
          //   }else if ((d.values[0][property]).search('/') > 0 && property != "state" && property != "abbr" && property != "county"){
          //     e[property] == "N/A"
          //   }else {
              e[property] = d.values[0][property]
            // }
          }
        }
      })
    })

  var state_data = transformData(state)

    state_data.forEach(function(d,i){ 
      for (var property in d["values"][0]) {
        d[property] = d.values[0][property]
      }
      stateData.forEach(function(e, j) { 
        if (+d.key == e.id) {
          for (var property in d["values"][0]) {
            // if (isNaN(+d.values[0][property]) == true && property != "state" && property != "abbr" && property != "county") {
            //   e[property] == null
            // }else { 
              e[property] = d.values[0][property]
            // }
          }
        }
      })
    })

  
  var us_data_ph = state_data.filter(function(d) {
    return d.state == "USA"
  })
  var filteredCounties = county_data.filter(function(d) {
    return d.state == "USA"
  })
  var tmp_county = topojson.feature(us, us.objects.counties).features;
  for (var i =0; i<tmp_county.length; i++){
    var mergeID = +tmp_county[i]["id"]
    for (var j = 0; j<countyData.length;j++){
      if(+countyData[j]["id"] == mergeID){ 
          for (var property in countyData[j]) { 
            var data = (isNaN(countyData[j][property]) == true) ? countyData[j][property] : +countyData[j][property];
            tmp_county[i]["properties"][property] = data;
          }
        break;
      }
    }
  }
  var tmp_state = topojson.feature(us, us.objects.states).features;
  for (var i =0; i<tmp_state.length; i++){
    var mergeIDState = tmp_state[i]["id"]
    for (var j = 0; j<stateData.length;j++){
      if(stateData[j]["id"] == mergeIDState){ 
        for (var property in stateData[j]) {
          var data = (isNaN(stateData[j][property]) == true) ? stateData[j][property] : +stateData[j][property];
          tmp_state[i]["properties"][property] = data;
        }
        break;
      }
    }
  }
  /*END*/
    function createSearchArray(filter) { 
      var searchArray = [];
      if (zoomNational == true) {
        for (var i = 0; i<tmp_state.length; i++){
         searchArray.push(tmp_state[i]["properties"]["state"])
        }
        for (var i = 0; i<tmp_county.length; i++){
         searchArray.push(tmp_county[i]["properties"]["county"] + ", " + tmp_county[i]["properties"]["abbr"])
        }
      }else if (zoomState == true) { 
        for (var i = 0; i<tmp_county.length; i++){ 
          if (tmp_county[i]["properties"]["abbr"] == filter) {
            searchArray.push(tmp_county[i]["properties"]["county"] + ", " + tmp_county[i]["properties"]["abbr"])
          }
        }
      }
     dropdown = searchArray
     $('input[name="tags"').tagit("option", {
        availableTags: dropdown,
      })
    }

    $( "#searchBox" ).autocomplete({
      appendTo: ".search-div",
    });

    $('input[name="tags"').tagit({
        availableTags: dropdown,
        allowSpaces: true,
        autocomplete:{
          // availableTags: searchArray, // this param is of course optional. it's for autocomplete.
          // configure the name of the input field (will be submitted with form), default: item[tags]
          itemName: 'item',
          fieldName: 'tags',
          onlyAvailableTags: true,
          tagLimit: 2,
          appendTo: ".search-div",
          open: function(event, ui) {
            $("#ui-id-2").width($(".search-div").width())
            $("#ui-id-2").css("left", "0px")
            $("#ui-id-2").css("top", "87px")
          },
        },
        beforeTagAdded: function(event, ui) { 
        // ($("li#county >span").text("hello"))
          // if ($("ul.tagit li.tagit-choice-editable").width() < 70) { console.log('1')
          //   $("ul.tagit li.tagit-choice-editable").css("margin-right", "100px")
          // }else {
          //   $("ul.tagit li.tagit-choice-editable").css("margin-right", "0px")
          // }
          if(dropdown.indexOf(ui.tagLabel) == -1){ 
            return false;
          }
          if(ui.tagLabel == "not found"){
              return false;
          }
        },
        afterTagAdded: function(event, ui) { 
          ($(".ui-widget").css("height", 55))
          var tag = (ui.tag[0]["textContent"]);
          var county = (tag.search(",") > 0) ? tag.split(",")[0] : "";
          var state = (tag.search(",") > 0) ? (tag.split(", ")[1]).slice(0,-1) : tag.slice(0,-1);
          var geoData = (tag.search(",") > 0) ? tmp_county : tmp_state;
          var geoType = (tag.search(",") > 0) ? "county" : "state";
          var geography = (geoType == "county") ? county : state;
          // var filteredCounty = tmp_county.filter(function(d) { 
            // if (geoType == "county"){
            //   return d.properties["county"] == county && d.properties["abbr"] == state
            // }else {
          //     return d.properties["county"] == tagContent;
          //   // }
          // })
          // var filteredState = tmp_state.filter(function(d) {
          //   return d.properties["state"] == tagContent
          // })
          var filteredData = geoData.filter(function(d) {
            return d.properties[geoType] == geography
          })
          console.log(filteredData)
          // var geoType = (filteredCounty.length != 0) ? "county" : "state";
          // var county = tagContent;
          // var filteredData = (filteredCounty.length != 0) ? filteredCounty : filteredState;
          var data = filteredData[0]
          // var state = data["properties"]["abbr"]
          zoomMap(data, geoType)
          if (geoType == "county") { 
            addTag(data["properties"]["state"], county, state)
          }else {
            var filter = data["properties"]["abbr"]
            createSearchArray(filter)
          }
        },
        afterTagRemoved: function(event,ui) { 
           var tag = (ui.tag[0]["textContent"]);
           if (tag.search(",") > 0) { 
            d3.selectAll(".counties > path.selected")
              .classed("selected", false)
            setZoom(false, true, false)
           }else { 
            d3.select("#location").html("National")
            d3.selectAll(".state-borders > path.selected")
              .classed("selected", false)
            setZoom(true, false, false)
            zoomMap(null, "national")
           }
          updateBars(SELECTED_VARIABLE)
          createSearchArray("")
        }
    });
    $(".ui-widget").css("height", 55)
    $(".ui-widget-content.ui-autocomplete-input").css({"font-style" : "italic"})
    $(".ui-widget-content.ui-autocomplete-input").css({"font-weight" : "400"})
    $('.ui-widget-content.ui-autocomplete-input').attr('placeholder', 'Search for a state or county')
    $('.ui-widget-content.ui-autocomplete-input').focusin(function(){
        $(this).attr('placeholder','');
    });
    $('.ui-widget-content.ui-autocomplete-input').focusout(function(){
        $(this).attr('placeholder','Search for a state or county');
    });
    createSearchArray("")

  // });
  var zoom = d3.zoom()
      // .translate([0, 0])
      // .scale(1)
      .scaleExtent([0, 8])
  //     .on("zoom", zoomed);


  var min = d3.min(tmp_county, function(d) {
    return d.properties[SELECTED_VARIABLE]
  })
  var max = d3.max(tmp_county, function(d) { 
    return d.properties[SELECTED_VARIABLE]
  })
  var quantize = d3.scaleThreshold()
    .domain(BREAKS[SELECTED_VARIABLE])
    .range(["#cfe8f3", "#73bfe2", "#1696d2", "#0a4c6a", "#000000"])  

 /*ADD DROPDOWNS*/
    var categoryData = [{label: "Share with any debt in collections", variable: "perc_debt_collect"},
    {label: "Median debt in collections, 2016", variable: "med_debt_collect"},
    {label: "Share with medical debt in collections, 2016", variable: "perc_debt_med"},
    {label: "Median medical debt in collections, 2016", variable: "med_debt_med"},
    {label: "Share of non-white population, 2015", variable: "perc_pop_nw"},
    {label: "Share without health insurance, 2015", variable: "perc_pop_no_ins" },
    {label: "Average household income, 2015", variable: "avg_income"}]
    
    var table = d3.select("#table-div")
    var stateMenu = d3.select(".state-menu")
      .append("select")
      .attr("id", "state-select")
    var optionsState = stateMenu
      .selectAll('option')
      .data(state_data)
    optionsState.enter()
      .append('option')
      .text(function(d) {
        return d.state
      })
      .attr('value', function(d) {
        return d.state
      })
    var countyMenu = d3.select(".county-menu")
      .append("select")
      .attr("id", "county-select")
    var optionsCounty = countyMenu
      .selectAll('option')
      .data(filteredCounties)
    optionsCounty.enter()
      .append('option')
      .text(function(d) {
        return d.county
      })
   var categoryMenu = d3.select(".category-menu")
        .append("select")
        .attr("id", "category-select")
      var optionsCategory = categoryMenu
        .selectAll('option')
        .data(categoryData)
      optionsCategory.enter()
        .append('option')
        .text(function(d) {
          return d.label
        })
        .attr('value', function(d) {
          return d.variable
        })
  function filterCountyMenu(selectedState) {
    var filteredCounties = county_data.filter(function(d) {
      return d.state == selectedState
    })
        var optionsCounty = countyMenu
          .selectAll('option')
          .data(filteredCounties)
        optionsCounty.exit().remove()
        var optionsCountyEnter = optionsCounty.enter()
          .append('option')
          .text(function (d) { 
            return d.county; 
          })
          .attr('value', function(d){ 
            return d.county
          })
        optionsCounty.merge(optionsCountyEnter)
          .text(function (d) { 
            return d.county; 
          })
          .attr('value', function(d){ 
            return d.county
          })
        if (selectedState != "USA") { 
          d3.selectAll(".dropdown-label").classed("disabled", false)
          d3.select("#county-select")
            .append('option')
            .text("Select a county")
            .attr('value', '')
            .attr("selected", "selected")
            .attr("disabled", "disabled")
            .attr("hidden", "hidden")
        }else {
          d3.select(".county-menu").select(".dropdown-label").classed("disabled", true)

        }
    $("#county-select").selectmenu("refresh");
  }

  var selectedLocation = function() { 
    selectedCountyPh = (d3.select("#county-select-menu").select(".ui-state-active").node() == null) ? "" : d3.select(".county-menu").select(".ui-selectmenu-text").text()
    selectedStatePh = d3.select("#state-select-button").select(".ui-selectmenu-text").text()
  }

  $("#state-select")
    .selectmenu({
      open: function(event,ui) {

      },
      close: function(event, ui) {

      },
      change: function(event, ui) {
        selectedLocation()
        var selectedState = ui.item.value
        if (selectedState != "USA") {
          $(".bar-State").css("display", "block")
          $(".bar-County").css("display", "none")
          var selectedPlace = ui.item.value
          var selectedCategory = $("#category-select").val()
          updateBars(selectedCategory, selectedPlace)
        }else {
          $(".bar-County").css("display", "none")
          $(".bar-State").css("display", "none")

        }

        filterCountyMenu(selectedState)

      }
    })
    .selectmenu("menuWidget")
    .addClass("ui-menu-icons customicons")
  $("#county-select")
    .selectmenu({
      open: function(event,ui) {

      },
      close: function(event, ui) {

      },
      change: function(event, ui) {
        selectedLocation()
        $(".bar-County").css("display", "block")
        var selectedPlace = ui.item.value
        var selectedCategory = $("#category-select").val()
        updateBars(selectedCategory, selectedPlace)


      }
    })
    .selectmenu("menuWidget")
    .addClass("ui-menu-icons customicons")
  $("#category-select")
    .selectmenu({
      open: function(event,ui) {

      },
      close: function(event, ui) {

      },
      change: function(event, ui) {
        var selectedCategory = ui.item.value
        selectedLocation()
        updateBars(selectedCategory, selectedStatePh)

      }
    })
    .selectmenu("menuWidget")
    .addClass("ui-menu-icons customicons")
  /*ADD MAP*/
    var svg = d3.select("#map")
      .append("svg")
      .attr("width", width)
      .attr("height", height)

    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "background")
    var path = d3.geoPath()
    var g = svg.append("g")
      .attr("class", "map-g")
      .attr("transform", "translate(" + 0 + "," + height / 10 + ")scale(" +width/1060 + ")")

      // .attr("transform",  "scale(" + width/1060 + ")");
    g.append("g")
      .attr("class", "counties")
      .selectAll("path")
      .data(tmp_county)
      .enter().append("path")
      .attr("d", path)
      .attr("id", function (d) { return d.properties.abbr + d.id; })
      .style("fill", function(d){ 
          return (isNaN(d.properties[SELECTED_VARIABLE]) == true) ? "#adabac" : quantize(d.properties[SELECTED_VARIABLE]);
      })
      .on('click', function(d) { 
        var state = d.properties.state;
        var stateData = tmp_state.filter(function(d){ 
          return d.properties.state == state
        })
        var selectedState = stateData[0]
        var previousState = (d3.select(".state-borders > path.selected").node() != null) ? d3.select(".state-borders > path.selected").attr("id") : ""
        var selectedCounty = (d["properties"])
        var level = (zoomState == true && previousState == d["properties"]["abbr"]) ? "county": "state";
        var county = d.properties["county"]
        var abbr = d.properties["abbr"]
        if (d3.select(this).classed('selected') == true) {
          d3.select(this).classed('selected', false)
          if (level == "county") { 
            $('ul.tagit > li:nth-child(2)').remove()
            setZoom(false, true, false)
            updateTable(selectedState)
            updateBars(SELECTED_VARIABLE, d)
          }
        }else {
          var county = (level == "state") ? null : county;
          addTag(state, county, abbr)
          zoomMap(d, level)
          updateBars(SELECTED_VARIABLE, d)
        }
      })
      .on('mouseover', function(d) {
        var previousState = (d3.select(".state-borders > path.selected").node() != null) ? d3.select(".state-borders > path.selected").attr("id") : ""
        var hoveredState = d.properties.abbr
        var geography = (zoomState == true && previousState == hoveredState) ? "county" : "state";
        var county = (geography == "county") ? d.properties.county : ""
        var state = d.properties.abbr
        if (zoomNational == true ) { 
          $(".state-borders").css("pointer-events", "all")
          $(".counties").css("pointer-events", "none")
          hoverLocation("", d.properties.abbr, "state");
          updateBars(SELECTED_VARIABLE, d) 
        }else{
          if (geography == "state") { 
            hoverLocation(county, state, geography)
            updateBars(SELECTED_VARIABLE, d3.select("path#" + hoveredState).datum())
          }else {
            hoverLocation(county, state, geography)
            updateBars(SELECTED_VARIABLE, d)
          }
          // $(".state-borders").css("pointer-events", "none")
          // $(".counties").css("pointer-events", "all")

        }
      })
      .on('mouseout', function(d) { 
        if (d3.select(".counties > path.selected").node() != undefined) { //IF A COUNTY IS SELECTED
          var county = d3.select(".counties > path.selected").datum().properties.county
          var abbr = d3.select(".counties > path.selected").datum().properties.abbr
          d3.selectAll(".state-borders > path").classed("hide", true)
          d3.select(".state-borders > path#" + abbr).classed("hide", false)
          d3.select("#location").html(county + ", " + abbr)
          d3.selectAll("path.selected").moveToFront()
          d3.selectAll(".hover")
            .classed("hover", false)
            .classed("hoverNational", false)
          setZoom(false, true, true)
          updateBars(SELECTED_VARIABLE, d3.select(".counties > path.selected").datum())
        }else if (d3.select(".state-borders > path.selected").node() != undefined) { //IF A STATE IS SELECTED
          var state = d3.select(".state-borders > path.selected").datum().properties.state
          var abbr = d3.select(".state-borders > path.selected").datum().properties.abbr
          d3.selectAll(".state-borders > path").classed("hide", true)
          d3.select(".state-borders > path#" + abbr).classed("hide", false)
          d3.select("#location").html(state)
          d3.selectAll("path.selected").moveToFront()
          d3.selectAll(".hover")
          .classed("hover", false)
          .classed("hoverNational", false)
          setZoom(false, true, false)
          updateBars(SELECTED_VARIABLE, d3.select(".state-borders > path.selected").datum())
        }
      })

    var states = topojson.feature(us, us.objects.states);
    var projection = d3.geoAlbersUsa()
    projection.fitSize([width, height], states);

    g.append("g")
      .attr("class", "state-borders")
      .selectAll("path")
      .data(tmp_state)
      .enter().append("path")
      .attr("d", path)
      .attr("id", function(d){
        return d.properties.abbr
      })
      .on('click', function(d) {
        var state = d.properties.state;
        // var county = d.properties.county;
        var abbr = d.properties.abbr;
        var level = "state"
        setZoom(false, true, false)
        // $(".state-borders").css("pointer-events", "none")
        // $(".counties").css("pointer-events", "all")
        addTag(state, null, abbr)
        zoomMap(d, level)
        updateBars(SELECTED_VARIABLE, d)
      })
      .on('mouseover', function(d) { 
        if (zoomNational == true) { 
          // $(".state-borders").css("pointer-events", "all")
          // $(".counties").css("pointer-events", "none")
          hoverLocation("", d.properties.abbr, "state");
          updateBars(SELECTED_VARIABLE, d) 
        }else {
          // $(".state-borders").css("pointer-events", "none")
          // $(".counties").css("pointer-events", "all")

        }
      })
      .on('mouseout', function(d) {
        if (zoomNational==true) {
          d3.select('#location').html('National')
          if (d3.select(".state-borders > path.selected").node() != undefined) {
            var state = d3.select(".state-borders > path.selected").datum().properties.state
            d3.select("#location").html(state)
            d3.selectAll("path.selected").moveToFront()
          }else {
            d3.selectAll(".hover")
              .classed("hover", false)
              .classed("hoverNational", false)
            updateBars(SELECTED_VARIABLE, undefined)
          }
        }
      })

    /*ZOOM OUT BUTTON*/
    var data = [{x: width - 35, y: height / 1.5, id: "zoom_out"}]
    var button = svg.selectAll(".zoomBtn")
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'zoomBtn')
      .attr('id', function(d) {
        return d.id
      })
      .attr('transform', function(d) {
        return 'translate(' + d.x + ',' + (height - 80 ) + ')'
      });
      // .on('click', function(d) {
      //   var factor = (this.id === 'zoom_in') ? 2 : .9;
      //   zoomed(factor)
      // })

    button
      .append("image")
      .attr("xlink:href", "img/reload.png")
      .attr("x", -15)
      .attr("y", 10)
      .attr("width", 50)
      .attr("height", 50)
      .on('click', function() {
        zoomMap(null, "national")
      })

    // d3.select(".map-g")
    //   .call(d3.zoom().on("zoom", function () {
    //           d3.select(".map-g").attr("transform", d3.event.transform)
    //   }))


  function zoomed(factor) { 
      setZoom(true, false, false)
      var centroid = [width/2, height/2], //replace with variable d to center by county 
          x = centroid[0],
          y = centroid[1],
          k = factor;
      // var data = (zoomLevel == "state") ? d3.select("path#" + selectedState.properties.abbr).datum() : d;
      g.transition()
          .duration(750)
          .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
          .style("stroke-width", 1.5 / k + "px");
  }


/*LEGEND*/
  var legend = svg
    .append("g")
    .attr("class", "g-legend")
    .attr("height", height/2)
    .attr("width", function() {
      return (IS_MOBILE) ? 45 : 50;
    })
    .attr('transform', function() {
      return (IS_MOBILE) ? 'translate(' + (width- 68) + ',' + 10 + ')' : 'translate(' + (width- 55) + ',' + 10 + ')';
    })
  legend.append("rect")
    .attr("width", function() {
      return (IS_MOBILE) ? 73: 65
    })
    .attr("class", "rect-div")
    .attr("height", 170)
    .style("fill", "#f5f5f5")
    .style("opacity", 0.9)
    .attr('transform', 'translate(' + (-5) + ',' + -10 + ')')

  legend.append("text")
  var keyWidth =   15;
  var keyHeight =  30;
  for (i=0; i<=5; i++){
    if(i !== 5){  
      legend.append("rect")
        .attr("width",keyWidth)
        .attr("height",keyHeight)
        .attr("class","rect"+i)
        .attr("y",keyHeight*i)
        .attr("x", 38)
        .style("fill", COLORRANGE[i])
        // .on("mouseover",function(){ mouseEvent({type: "Legend", "class": (d3.select(this).attr("class"))}, "hover") })
        // .on("mouseleave", function(){
        //   d3.selectAll(".demphasized").classed("demphasized",false)
        // })
    //     .on("click",function(){ mouseEvent(dataID, {type: "Legend", "class": "q" + (this.getAttribute("x")/keyWidth) + "-4"}, "click") })
      legend.append("text")
        .attr("x", 33)
        .attr("class","legend-labels")
        .attr("y",keyHeight*i)
        .attr("text-anchor", "end")
        .text(function(){
          var min = d3.min(tmp_county, function(d) { 
            return d.properties[SELECTED_VARIABLE]
          })
          var array = BREAKS[SELECTED_VARIABLE]
          return (i==0) ? formatNumber(min) : formatNumber((array[i-1]))
        })
     }
     if (i == 5) { 
      legend.append("text")
        .attr("x", 33)
        .attr("class","legend-labels")
        .attr("text-anchor", "end")
        .attr("y",keyHeight*i)
        .text(function(){
          var max = d3.max(tmp_county, function(d) { 
            return d.properties[SELECTED_VARIABLE]
          })
          return formatNumber(max)
        })
      }
    }
 

  d3.selection.prototype.moveToFront = function() {  
    return this.each(function(){
      this.parentNode.appendChild(this);
    });
  };
  d3.selection.prototype.moveToBack = function() {  
      return this.each(function() { 
          var firstChild = this.parentNode.firstChild; 
          if (firstChild) { 
              this.parentNode.insertBefore(this, firstChild); 
          } 
      });
  };
  function hoverLocation(county, state, geography) {
    var data = (geography == "county") ? tmp_county : tmp_state
    var filteredData = data.filter(function(d){ 
      if (geography == "county") {
        return d.properties.county == county && d.properties.abbr == state
      }else { 
        return d.properties.abbr == state
      }
    })
    d3.select("#location").html(function() { 
      return (geography=="county") ? filteredData[0]["properties"]["county"] + ", " + filteredData[0]["properties"]["abbr"] : filteredData[0]["properties"]["state"]
    })
    var id = (geography == "county") ? filteredData[0]["id"] : ""
    d3.select("path#" + filteredData[0]["properties"]["abbr"] + id)
      .classed('hover', true)
      .classed('hide', false)
      .classed("hoverNational", function() {
        return (zoomNational == true) ? true : false
      })
      .moveToFront()
  }

      // .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
      // .attr("id", "state-borders")
      // .attr("d", path)

  /*ADD TABLE*/
    $("#table-div").empty()
    var columns = ["Overall", "White", "Non-White"]
    var groups = ["Share with any debt in collections", "Median debt in collections, 2016", "Share with medical debt in collections, 2016", "Median medical debt in collections, 2016","Share of non-white population, 2015", "Share without health insurance coverage, 2015","Average household income, 2015"]
    var rowNumbers = [1,2,3]
    var rowData = ["perc_debt_collect", "med_debt_collect", "perc_debt_med", "med_debt_med", "perc_pop_nw", "perc_pop_no_ins", "avg_income"]
    var table = d3.select("#table-div")
      .append("table")
        tbody = table.selectAll('tbody')
          .data(rowData)
          .enter().append("tbody")
          .attr("class", function(d, i) {
            return "group group-" + i
          })
          .on('click', function(d) { 
            d3.selectAll('tbody')
              .classed('selected', false)
            d3.select(this)
              .classed('selected', true)
            if (d == "avg_income") {
              d3.select(".rect-div")
                .attr("width", 76)
                .attr('transform', 'translate(' + (-20) + ',' + -10 + ')')
            }else {
              d3.select(".rect-div")
              .attr("width", function() {
                return (IS_MOBILE) ? 73: 65
              })
              .attr('transform', 'translate(' + (-5) + ',' + -10 + ')')
            }
            setVariable(d)
            updateMap(d)
          })
    table.select('tbody').classed('selected', true)
    
    var us_data = state_data[0]["values"][0]
    for (var key in us_data) {
        if (us_data.hasOwnProperty(key)) { 
            if (+us_data[key] == NaN || +us_data[key] == 0){
              us_data[key = us_data[key]]
            }else {
              us_data[key] = +us_data[key]
            }
        }
    }

    var tr = tbody.selectAll('tr')
        .data(rowNumbers)
        .enter().append('tr')
        .attr("class", function(d,i) {
          if (i%3 == 0 ) {
            return "cell-header"
          }else if (i%3==2) {
            return "cell-column"
          }else {
            return "cell-data"
          }
        })
    d3.selectAll(".cell-header")
      .append("th")
      .attr("colspan", 3)
      .each(function(d,i) {
        d3.select(this)
          .text(function() { 
            return groups[i]
          })
      })
    d3.selectAll(".cell-column")
      .each(function() {
        d3.select(this).selectAll("td")
          .data(columns)
          .enter().append("td")
          .text(function(d) {
            return d
          })
      })
    d3.selectAll(".cell-data")
      .each(function(d,i) {
        var rowVariable = [rowData[i]],
            rowVariable_nw = rowVariable + "_nw";
            rowVariable_wh = rowVariable + "_wh";
        d3.select(this).selectAll("td")
          .data(columns)
          .enter().append("td")
          .text(function(d,i) {
            if (i==0) {
              return ((us_data[rowVariable]) == undefined) ? "N/A" : formatNumber(us_data[rowVariable]);
            }else if (i==1){
              return ((us_data[rowVariable_wh]) == undefined) ? "N/A" : formatNumber(us_data[rowVariable_wh]);
            }else if (i==2) {
              return ((us_data[rowVariable_nw]) == undefined) ? "N/A" : formatNumber(us_data[rowVariable_nw]);
            }
          })
      })
 
  /*END TABLE*/
  /*BAR CHARTS*/

  var groups = ["National", "State", "County"]
  var groups_ph = ["County", "State", "National"]
  var categories = ["Overall", "White", "Nonwhite"]
  var barData = [{data: us_data_ph}, {data: us_data_ph}, {data: us_data_ph} ]
    /*MOBILE*/
  var barWidth_ph = width
  var x_ph = d3.scaleLinear().range([0, width-30]);
  var y_ph = d3.scaleBand().range([30, 0]);
  // x_ph.domain([0, d3.max(state_data, function(d) { return d[SELECTED_VARIABLE]; })]);
  x_ph.domain([0, d3.max(state_data, function(d) {
    if (isNaN(d[NONWHITE]) == true && isNaN(d[WHITE]) == true){
      return d[SELECTED_VARIABLE]
    }else if (isNaN(d[NONWHITE]) == true && isNaN(d[WHITE]) == false) {
      return Math.max(d[WHITE], d[SELECTED_VARIABLE])
    }else if (isNaN(d[WHITE]) == true && isNaN(d[NONWHITE]) == false) {
      return Math.max(d[NONWHITE], d[SELECTED_VARIABLE])
    }else {
      return Math.max(d[WHITE], d[NONWHITE], d[SELECTED_VARIABLE])
    }
  })])
  y_ph.domain(us_data_ph.map(function(d) { return d[SELECTED_VARIABLE]; }));
  var xAxis_ph = d3.axisBottom()
      .scale(x_ph)
      .ticks(0)
  var yAxis_ph = d3.axisLeft()
      .scale(y_ph)
      .ticks(0)
  for (i=0; i<=groups_ph.length - 1; i++){
    var group = groups_ph[i]
    var category = categories[i]
    d3.select(".bar-" + group )
      .append("svg")
      .attr("width", barWidth_ph)
      .attr("height", height/3)
    var barG_ph = d3.select(".bar-" + group).select("svg").append("g")
      .attr("class", function(d,i) {
        return "bar-group-ph " + group
      })
      .attr("transform", "translate(" + 0 + "," + 10 + ")")
    barG_ph.append("text")
      .text(function(d,i) {
        return group;
      })
      .attr("class", function(d,i) {
        return "group-label-ph " + group
      })
    barG_ph.append("text")
      .attr("class", "group-label-2")
      .attr("transform", function(d,i) {
        var width = (d3.select(".group-label-ph." + group).node().getBoundingClientRect().width) + 5
        return "translate(" + width + "," + 0 + ")"
      })

    var subBarPh = barG_ph.selectAll("g")
      .data(categories)
      .enter()
      .append("g")
      .attr("class", function(d,i) {
        return "category " + categories[i]
      })
      .attr("transform", function(d,i) {
        return "translate(" + 0 + "," + 50*i + ")"
      })

    d3.selectAll(".bar-County, .bar-State")
      .style("display", "none")

    var rectG_ph = subBarPh.append("g")
      .attr("class", function(d) { 
        return "rect-g " + d})
      .attr("transform", function(d,i) {
        return "translate(" + 0 +"," + 10+ ")"
      })
    rectG_ph.append("g")
      .data(barData)
      .append("text")
      .attr("class", "data-label")
      .attr("y", -10)
      .attr("dy", ".71em")
      .attr("transform", function(d,i) {
        return "translate(" + (barWidth_ph-33) +"," + 0+ ")"
      })
      .attr("text-anchor", "start")
      .text(function(d) { 
        var parentClass = $(this).closest(".rect-g").attr("class")
        if (parentClass.search("Overall") > -1) { 
          return formatNumber(d.data[0][SELECTED_VARIABLE])
        }else if (parentClass.search("Non") > -1) {
          return formatNumber(d.data[0][NONWHITE])
        }else{
          return formatNumber(d.data[0][WHITE])
        }
      })
    rectG_ph
      .append("g")
      .attr("class", "g-text")
      .append("text")
      .attr("x", 0)
      .attr("y", -10)
      .attr("dy", ".71em")
      .attr("text-anchor", "start")
      .text(function(d,i) { return d});
    rectG_ph.append("g")
      .attr("class", "x axis")
      .attr("transform", function(d,i) {
        return "translate(" + 0 +"," + 30 + ")"
      })
      .call(xAxis_ph)
    rectG_ph.append("g")
      .attr("class", "y axis")
      .call(yAxis_ph)
    rectG_ph.selectAll(".bar")
      .data(us_data_ph)
      .enter().append("rect")
      .attr("class", "background-rect-ph")
      .attr("x", 0)
      .attr("height", y_ph.bandwidth())
      .attr("width", barWidth_ph)
      .style("fill", "#adabac")
    rectG_ph.selectAll("rect:not(.background-rect-ph)")
      .data(us_data_ph)
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("class", "bar")
      .attr("height", y_ph.bandwidth())
      .attr("width", function(d) { 
        var parentClass = d3.select(this.parentNode).attr('class');
        if (parentClass.search("Overall") > -1) {
          return x_ph(d[SELECTED_VARIABLE])
        }else if (parentClass.search("Non") > -1) {
          return x_ph(d[WHITE])
        }else{
          return x_ph(d[NONWHITE])
        }
      })
      .attr("fill", function(d) { 
        var parentClass = d3.select(this.parentNode).attr('class');
        if (parentClass.search("Overall") > -1) {
          return "#fdbf11"
        }else if (parentClass.search("Non") > -1) {
          return "#696969"
        }else{
          return "#000000"
        }
      })
  }



    var barSvgHeight = 120
    var barHeight = 51
    var barWidth = (IS_MOBILE) ? 45 : 50;
    var x = d3.scaleBand()
      .rangeRound([0, barWidth])

    var y = d3.scaleLinear()
        .rangeRound([barHeight, 0]);
    state_data.forEach(function(d) { 
      d.national = +d.values[0][SELECTED_VARIABLE]
    })
    state_data.forEach(function(d) { 
      d.white = +d.values[0][WHITE];
    })
    state_data.forEach(function(d) { 
      d.nonwhite = +d.values[0][NONWHITE]
    })
    x.domain([[us_data].map(function(d){ 
      return d.abbr
    })]);
    y.domain([0, d3.max(state_data, function(d) {
      if (isNaN(d.nonwhite) == true && isNaN(d.white) == true){
        return d.national
      }else if (isNaN(d.nonwhite) == true && isNaN(d.white) == false) {
        return Math.max(d.white, d.national)
      }else if (isNaN(d.white) == true && isNaN(d.nonwhite) == false) {
        return Math.max(d.nonwhite, d.national)
      }else {
        return Math.max(d.white, d.nonwhite, d.national)
      }
    })])

    var formatPercent = d3.format(".0%")
    var xAxis = d3.axisBottom()
        .scale(x)
    var yAxis = d3.axisLeft()
        .scale(y)
        .tickFormat(formatPercent);

    var barSvg = d3.select("#bar-chart")
      .append("svg")
      .attr('width', width)
      .attr('height', barSvgHeight)
    var barG = barSvg.selectAll("g")
      .data(groups)
      .enter()
      .append('g')
      .attr("transform", function(d,i) {
        return "translate(" + ( (width/3 + 5) * i) + "," + (20) + ")";
      })
      .attr("id", function(d) { 
        return d
      })
      .attr("class", "bar-group")
    barG.append("text")
      .text(function(d) {
        return (d=="National") ? d : "";
      })
      .attr("class", function(d) {
        return "group-label-2 " + d
      })
    barG.append("text")
      .attr("class", "group-label-2")
      // .attr("transform", function(d,i) {
      //   // var width = (d3.select(".group-label." + d).node().getBoundingClientRect().width) + 5
      //   return "translate(" + width + "," + 0 + ")"
      // })

    var subBarG = barG.selectAll("g")
      .data(categories)
      .enter()
      .append("g")
      .attr("class", function(d) {
        return "category " + d
      })
      .attr("transform", function(d,i) {
        return (IS_MOBILE) ? "translate(" + (50 * i ) + "," + 10 + ")" : "translate(" + (60 * i ) + "," + 10 + ")"
      })
    subBarG.selectAll("text")
      .data([us_data])
      .enter()
      .append("text")
      .attr("class", "data-label")
      .attr("transform", function(d,i) {
        return "translate(" + 0 +"," + 10+ ")"
      })
      .text(function(d) { 
        var parentClass = d3.select(this.parentNode).attr('class');
        if (parentClass.search("Overall") > -1) {
          return formatNumber(d[SELECTED_VARIABLE])
        }else if (parentClass.search("Non") > -1) {
          return formatNumber(d[NONWHITE])
        }else{
          return formatNumber(d[WHITE])
        }
      })

    //add background rects
    
    var rectG = subBarG.append("g")
      .attr("class", function(d) { 
        return "rect-g " + d})
      .attr("transform", function(d,i) {
        return "translate(" + 0 +"," + 15+ ")"
      })
    rectG
      .append("g")
      .attr("class", "g-text")
      .append("text")
      .attr("x", 0)
      .attr("y", barHeight + 10)
      .attr("dy", ".71em")
      .attr("text-anchor", "start")
      .text(function(d) { return d});
    rectG.append("g")
      .attr("class", "x axis")
      .attr("transform", function(d,i) {
        return "translate(" + 0 +"," + barHeight+ ")"
      })
      .call(xAxis)
    rectG.selectAll("rect")
      .data([us_data])
      .enter()
      .append("rect")
      .attr("x", function(d) { 
        return d.abbr
      })
      .attr("class", "background-rect")
      .attr("width", x.bandwidth())
      .attr("height", function(d) {
        var parentClass = d3.select(this.parentNode).attr('class');
        if (parentClass.search("Overall") > -1) {
          return barHeight //- y(d[SELECTED_VARIABLE])
        }else if (parentClass.search("Non") > -1){
          return barHeight //- y(d[NONWHITE])
        }else{
          return barHeight //- y(d[WHITE])
        }
      })
      .style("fill", "#adabac")
    //add bars
    rectG.selectAll("rect:not(.background-rect)")
      .data([us_data])
      .enter()
      .append("rect")
      .attr("x", function(d) { 
        return d.abbr
      })
      .attr("class", "bar")
      .attr("fill", function(d) { 
        var parentClass = d3.select(this.parentNode).attr('class');
        if (parentClass.search("Overall") > -1) {
          return "#fdbf11"
        }else if (parentClass.search("Non") > -1) {
          return "#696969"
        }else{
          return "#000000"
        }
      })
      .attr("width", x.bandwidth())
      .attr("y", function(d) { 
        var parentClass = d3.select(this.parentNode).attr('class');
        if (parentClass.search("Overall") > -1) {
          return y(d[SELECTED_VARIABLE])
        }else if (parentClass.search("Non") > -1) {
          return y(d[NONWHITE])
        }else{
          return y(d[WHITE])
        }
      })
      .attr("height", function(d) {
        var parentClass = d3.select(this.parentNode).attr('class');
        if (parentClass.search("Overall") > -1) {
          return barHeight - y(d[SELECTED_VARIABLE])
        }else if (parentClass.search("Non") > -1){
          return barHeight - y(d[NONWHITE])
        }else{
          return barHeight - y(d[WHITE])
        }
      })

    d3.selectAll("#State, #County").style("opacity", 0)

  function formatNumber(d) { 
    var percent = d3.format(",.1%"),
        number = d3.format("$,.0f");
    return (d<1) ? percent(d) : number(d);
  }

  function updateMap(variable) {
    var min = d3.min(tmp_county, function(d) {
      return d.properties[variable]
    })
    var max = d3.max(tmp_county, function(d) { 
      return d.properties[variable]
    })
  
    var quantize = d3.scaleThreshold()
      .domain(BREAKS[variable])
      .range(["#cfe8f3", "#73bfe2", "#1696d2", "#0a4c6a", "#000000"])        
    d3.selectAll(".legend-labels")
      .each(function(d,i) {
        d3.select(this)
          .text(function(){
            var min = d3.min(tmp_county, function(d) {
              return d.properties[variable]
            })
            var max = d3.max(tmp_county, function(d) {
              return d.properties[variable]
            })
            var array = BREAKS[SELECTED_VARIABLE]
            if (i==0) {
              return formatNumber(min)
            }else if (i==5) {
              return formatNumber(max)
            }else {
              return formatNumber(array[i-1])
            }
        })
      })
    d3.select(".counties").selectAll("path")
    .transition()
    .duration(800)
    .style("fill", function(d){
        return (isNaN(d.properties[variable]) == true) ? "#adabac" : quantize(d.properties[variable]);
    })
    var selected = (d3.select("path.selected").node() != null) ? (d3.select("path.selected").datum()) : undefined
    updateBars(variable, selected)
  }


  function updateBars(variable, selected) { 
    var WHITE = variable + "_wh"
    var NONWHITE = variable + "_nw"
    var data = (selectedCountyPh != "") ? county_data : state_data;
    /**MOBILE**/
    if (IS_PHONE) {
      var state_data_ph = state_data.filter(function(d) {
        return d.state == selectedStatePh
      })
      var county_data_ph = county_data.filter(function(d) {
        return d.county == selectedCountyPh && d.state == selectedStatePh
      })
      x_ph.domain([0, d3.max(data, function(d) {
        if (isNaN(d[NONWHITE]) == true && isNaN(d[WHITE]) == true){
          return d[variable]
        }else if (isNaN(d[NONWHITE]) == true && isNaN(d[WHITE]) == false) {
          return Math.max(d[WHITE], d[variable])
        }else if (isNaN(d[WHITE] == true && isNaN(d[NONWHITE])) == false) {
          return Math.max(d[NONWHITE], d[variable])
        }else {
          return Math.max(d[WHITE], d[NONWHITE], d[variable])
        }
      })])
      var National = d3.select(".bar-group-ph.National").selectAll(".category")
      National
        .each(function() {
          d3.select(this).select(".bar")
            .data(us_data_ph)
            .transition()
            .duration(300)
            .attr("width", function(d) { 
              var parentClass = d3.select(this.parentNode).attr('class');
              if (parentClass.search("Overall") > -1) {
                return (isNaN(d[variable]) != true) ? x_ph(d[variable]) : 0
              }else if (parentClass.search("Non") > -1) {
                return (isNaN(d[NONWHITE]) != true) ?  x_ph(d[NONWHITE]) : 0
              }else{
                return (isNaN(d[WHITE]) != true) ?  x_ph(d[WHITE]) : 0
              }
            })
          d3.select(this).select(".data-label")
            .data(us_data_ph)
            .text(function(d) { 
              var parentClass = $(this).closest(".rect-g").attr("class")
              if (parentClass.search("Overall") > -1) { 
                return (isNaN(d[variable]) != true) ? formatNumber(d[variable]) : ""
              }else if (parentClass.search("Non") > -1) {
                return (isNaN(d[NONWHITE]) != true) ? formatNumber(d[NONWHITE]) : ""
              }else{
                return (isNaN(d[WHITE]) != true) ? formatNumber(d[WHITE]) : ""
              }
            })
        })

      var State = d3.select(".bar-group-ph.State").selectAll(".category")
      State
        .each(function() {
          d3.select(this).select(".bar")
            .data(state_data_ph)
            .transition()
            .duration(300)
            // .attr("height", y_ph.bandwidth())
            .attr("width", function(d) { 
              var parentClass = d3.select(this.parentNode).attr('class');
              if (parentClass.search("Overall") > -1) { 
                return (isNaN(d[variable]) != true) ? x_ph(d[variable]) : 0
              }else if (parentClass.search("Non") > -1) {
                return (isNaN(d[NONWHITE]) != true) ?x_ph(d[NONWHITE]) : 0
              }else{
                return (isNaN(d[WHITE]) != true) ? x_ph(d[WHITE]) : 0
              }
            })
          d3.select(this).select(".data-label")
            .data(state_data_ph)
            .text(function(d) { 
              var parentClass = $(this).closest(".rect-g").attr("class")
              if (parentClass.search("Overall") > -1) { 
                return (isNaN(d[variable]) != true) ? formatNumber(d[variable]) : ""
              }else if (parentClass.search("Non") > -1) {
                return (isNaN(d[NONWHITE]) != true) ? formatNumber(d[NONWHITE]) : ""
              }else{
                return (isNaN(d[WHITE]) != true) ? formatNumber(d[WHITE]) : ""
              }
            })
        })
      if (selectedCountyPh != "") {
        var County = d3.select(".bar-group-ph.County").selectAll(".category")
        County
          .each(function() {
            d3.select(this).select(".bar")
              .data(county_data_ph)
              .transition()
              .duration(300)
              // .attr("height", y_ph.bandwidth())
              .attr("width", function(d) { 
                var parentClass = d3.select(this.parentNode).attr('class');
                if (parentClass.search("Overall") > -1) { 
                  return (isNaN(d[variable]) != true) ? x_ph(d[variable]) : 0
                }else if (parentClass.search("Non") > -1) {
                  return (isNaN(d[NONWHITE]) != true) ? x_ph(d[NONWHITE]) : 0
                }else{
                  return (isNaN(d[WHITE]) != true) ? x_ph(d[WHITE]) : 0
                }
              })
            d3.select(this).select(".data-label")
              .data(county_data_ph)
              .text(function(d) { 
                var parentClass = $(this).closest(".rect-g").attr("class")
                if (parentClass.search("Overall") > -1) { 
                  return (isNaN(d[variable]) != true) ? formatNumber(d[variable]) : ""
                }else if (parentClass.search("Non") > -1) {
                  return (isNaN(d[NONWHITE]) != true) ? formatNumber(d[NONWHITE]) : ""
                }else{
                  return (isNaN(d[WHITE]) != true) ? formatNumber(d[WHITE]) : ""
                }
              })
          })
      }
    }else {
      /*DESKTOP*/
    var data = (selectedCountyPh != undefined || d3.selectAll(".counties").selectAll("path.hover").size() > 0) ? county_data : state_data;
    // var data = (zoomCounty == true) ? county_data : state_data;
    var x = d3.scaleBand()
      .rangeRound([0, 50])
    // var y = d3.scaleLinear()
    //   .rangeRound([barHeight, 0]);
    data.forEach(function(d) { 
      d.national = +d.values[0][variable]
    })
    data.forEach(function(d) { 
      d.white = +d.values[0][WHITE];
    })
    data.forEach(function(d) { 
      d.nonwhite = +d.values[0][NONWHITE]
    })
    x.domain([[us_data].map(function(d){
      return d.abbr
    })]);

    y.domain([0, d3.max(data, function(d) {
      if (isNaN(d.nonwhite) == true && isNaN(d.white) == true){
        return d.national
      }else if (isNaN(d.nonwhite) == true && isNaN(d.white) == false) {
        return Math.max(d.white, d.national)
      }else if (isNaN(d.white) == true && isNaN(d.nonwhite) == false) {
        return Math.max(d.nonwhite, d.national)
      }else {
        return Math.max(d.white, d.nonwhite, d.national)
      }
    })])
    console.log(y.domain())


      var National = d3.select("#National").selectAll(".category")
      National
        .each(function() {
          d3.select(this).select(".bar")
            .data([us_data])
            .transition()
            .duration(300)
            .attr("y", function(d) {  
              var parentClass = d3.select(this.parentNode).attr('class');
              if (parentClass.search("Overall") > -1) { 
                return (isNaN(d[variable]) != true) ? y(d[variable]) : barHeight;
              }else if (parentClass.search("Non") > -1) { 
                return (isNaN(d[NONWHITE]) != true) ? y(d[NONWHITE]) : barHeight;
              }else {
                return (isNaN(d[WHITE]) != true) ? y(d[WHITE]) : barHeight;
              }
            })
            .attr("height", function(d) { 
              var parentClass = d3.select(this.parentNode).attr('class');
              if (parentClass.search("Overall") > -1) { 
                return (isNaN(d[variable]) != true) ? barHeight - y(d[variable]) : 0;
              }else if (parentClass.search("Non") > -1){ 
                return (isNaN(d[NONWHITE]) != true) ? barHeight - y(d[NONWHITE]) : 0;
              }else {
                return (isNaN(d[WHITE]) != true) ? barHeight - y(d[WHITE]) : 0;
              }
            })
          d3.select(this).select(".data-label")
            .data([us_data])
            .text(function(d) {
              var parentClass = d3.select(this.parentNode).attr('class');
              if (parentClass.search("Overall") > -1) { 
                return (isNaN(d[variable]) != true) ? formatNumber(d[variable]) : ""
              }else if (parentClass.search("Non") > -1) {
                return (isNaN(d[NONWHITE]) != true) ? formatNumber(d[NONWHITE]) : ""
              }else{
                return (isNaN(d[WHITE]) != true) ? formatNumber(d[WHITE]) : ""
              }
            })
        })
      // if (mouseout == true) { //NATIONAL VIEW AND MOUSE OUT STATES



      // }else { console.log(d3.select(this))
        // var State = d3.select("#State").selectAll(".category")
        // State
        //   .each(function() {
        //     d3.select(this).select(".bar")
        //       .data([state_data])
        //       .transition()
        //       .duration(300)
        //       .attr("y", function(d) {  console.log(d)
        //         var parentClass = d3.select(this.parentNode).attr('class');
        //         if (parentClass.search("Overall") > -1) { 
        //           return (isNaN(d[variable]) == false) ? y(d[variable]) : barHeight;
        //         }else if (parentClass.search("Non") > -1) {
        //           return (isNaN(d[NONWHITE]) == false) ? y(d[NONWHITE]) : barHeight;
        //         }else {
        //           return (isNaN(d[WHITE]) == false) ? y(d[WHITE]) : barHeight;
        //         }
        //       })
        //       .attr("height", function(d) {
        //         var parentClass = d3.select(this.parentNode).attr('class');
        //         if (parentClass.search("Overall") > -1) {
        //           return (isNaN(d[variable]) == false) ? barHeight - y(d[variable]) : 0;
        //         }else if (parentClass.search("Non") > -1){
        //           return (isNaN(d[NONWHITE]) == false) ? barHeight - y(d[NONWHITE]) : 0;
        //         }else {
        //           return (isNaN(d[WHITE]) == false) ? barHeight - y(d[WHITE]) : 0;
        //         }
        //       })
        //   })
      // }
      if (zoomNational == true && selected == undefined) {  
        d3.selectAll("#State, #County").style("opacity", 0)
      } else if (zoomNational == false || selected != undefined) { //IF MOUSE IS OVER A STATE OR COUNTY IN WHICHEVER VIEW
        var countyID = (d3.select(".counties > path.selected").node() == null) ? "" : d3.select(".counties > path.selected").attr("id");
        var countyIDHov = (d3.select(".counties > path.hover").node() == null) ? "" : d3.select(".counties > path.hover").attr("id");
        var county = countyID.slice(2,)
        var state = selected["properties"]["abbr"]
        var data = (county == "") ? tmp_state : tmp_county
        var State = d3.select("#State").selectAll(".category")
        var selectedState = d3.select("path#" + selected["properties"]["abbr"]).datum()
        var stateData = selectedState["properties"]
        
        d3.select("#State").select(".group-label-2").text(stateData["state"])
        State
          .each(function() {
            d3.select(this).select(".bar")
              .data([stateData])
              .transition()
              .duration(300)
              .attr("y", function(d) {  
                var parentClass = d3.select(this.parentNode).attr('class');
                if (parentClass.search("Overall") > -1) { 
                  return (isNaN(d[variable]) != true) ? y(d[variable]) : barHeight;
                }else if (parentClass.search("Non") > -1) {
                  return (isNaN(d[NONWHITE]) != true) ? y(d[NONWHITE]) : barHeight;
                }else {
                  return (isNaN(d[WHITE]) != true) ? y(d[WHITE]) : barHeight;
                }
              })
              .attr("height", function(d) {
                var parentClass = d3.select(this.parentNode).attr('class');
                if (parentClass.search("Overall") > -1) {
                  return (isNaN(d[variable]) != true) ? barHeight - y(d[variable]) : 0;
                }else if (parentClass.search("Non") > -1){
                  return (isNaN(d[NONWHITE]) != true) ? barHeight - y(d[NONWHITE]) : 0;
                }else {
                  return (isNaN(d[WHITE]) != true) ? barHeight - y(d[WHITE]) : 0;
                }
              })
            d3.select(this).select(".background-rect")
              .data([stateData])
              .style("opacity", function(d) {
                var parentClass = d3.select(this.parentNode).attr('class');
                if (parentClass.search("Overall") > -1) {
                  return (isNaN(d[variable]) != true) ? 1 : 0.4;
                }else if (parentClass.search("Non") > -1){
                  return (isNaN(d[NONWHITE]) != true) ? 1 : 0.4;
                }else {
                  return (isNaN(d[WHITE]) != true) ? 1 : 0.4;
                }
              })
            d3.select(this).select(".data-label")
              .data([stateData])
              .text(function(d) {
                var noData = (d[variable] == "n<50") ? "n/a*" : "n/a**"
                var noData_wh = (d[WHITE] == "n<50") ? "n/a*" : "n/a**"
                var noData_nw = (d[NONWHITE] == "n<50") ? "n/a*" : "n/a**"
                var parentClass = d3.select(this.parentNode).attr('class');
                if (parentClass.search("Overall") > -1) { 
                  return (isNaN(d[variable]) != true) ? formatNumber(d[variable]) : noData
                }else if (parentClass.search("Non") > -1) {
                  return (isNaN(d[NONWHITE]) != true) ? formatNumber(d[NONWHITE]) : noData_nw
                }else{
                  return (isNaN(d[WHITE]) != true) ? formatNumber(d[WHITE]) : noData_wh
                }
              })
          })

            if (countyID.slice(0,2) == state || countyIDHov.slice(0,2) == state) { 
              d3.selectAll("#National, #State, #County").style("opacity", 1)
              // var stateData = tmp_state.filter(function(d){
              //     return d.properties.abbr == state
              // })
              // state_data.forEach(function(d) { 
              //   d.national = +d.values[0][variable]
              // })
              // state_data.forEach(function(d) { 
              //   d.white = +d.values[0][WHITE];
              // })
              // state_data.forEach(function(d) { 
              //   d.nonwhite = +d.values[0][NONWHITE]
              // })
            var County = d3.select("#County").selectAll(".category")
            var countyData = selected["properties"]
            d3.select("#County").select(".group-label-2").text(countyData["county"])

            County
              .each(function() {
                d3.select(this).select(".bar")
                  .data([countyData])
                  .transition()
                  .duration(300)
                  .attr("y", function(d) {  
                    var parentClass = d3.select(this.parentNode).attr('class');
                    if (parentClass.search("Overall") > -1) { 
                      return (isNaN(d[variable]) != true) ? y(d[variable]) : barHeight;
                    }else if (parentClass.search("Non") > -1) {
                      return (isNaN(d[NONWHITE]) != true) ? y(d[NONWHITE]) : barHeight;
                    }else {
                      return (isNaN(d[WHITE]) != true) ? y(d[WHITE]) : barHeight;
                    }
                  })
                  .attr("height", function(d) {
                    var parentClass = d3.select(this.parentNode).attr('class');
                    if (parentClass.search("Overall") > -1) {
                      return (isNaN(d[variable]) != true) ? barHeight - y(d[variable]) : 0;
                    }else if (parentClass.search("Non") > -1){
                      return (isNaN(d[NONWHITE]) != true) ? barHeight - y(d[NONWHITE]) : 0;
                    }else {
                      return (isNaN(d[WHITE]) != true) ? barHeight - y(d[WHITE]) : 0;
                    }
                  })
                d3.select(this).select(".background-rect")
                  .data([countyData])
                  .style("opacity", function(d) {
                    var parentClass = d3.select(this.parentNode).attr('class');
                    if (parentClass.search("Overall") > -1) {
                      return (isNaN(d[variable]) != true) ? 1 : 0.4;
                    }else if (parentClass.search("Non") > -1){
                      return (isNaN(d[NONWHITE]) != true) ? 1 : 0.4;
                    }else {
                      return (isNaN(d[WHITE]) != true) ? 1 : 0.4;
                    }
                  })

                d3.select(this).select(".data-label")
                  .data([countyData])
                  .text(function(d) {
                    var noData = (d[variable] == "n<50") ? "n/a*" : "n/a**"
                    var noData_wh = (d[WHITE] == "n<50") ? "n/a*" : "n/a**"
                    var noData_nw = (d[NONWHITE] == "n<50") ? "n/a*" : "n/a**"
                    var parentClass = d3.select(this.parentNode).attr('class');
                    if (parentClass.search("Overall") > -1) { 
                      return (isNaN(d[variable]) != true) ? formatNumber(d[variable]) : noData
                    }else if (parentClass.search("Non") > -1) {
                      return (isNaN(d[NONWHITE]) != true) ? formatNumber(d[NONWHITE]) : noData_nw
                    }else{
                      return (isNaN(d[WHITE]) != true) ? formatNumber(d[WHITE]) : noData_wh
                    }
                  })
              })
          }else {
            d3.selectAll("#County").style("opacity", 0)
            d3.selectAll("#National, #State").style("opacity", 1)
          }
        }
    }

  }
  function addTag(state, county, abbr) { 
      ($(".ui-widget").css("height", 47))
      d3.selectAll('li.tagit-choice').remove()
      var newTag = $("ul.tagit").append('<li id="state" class="tagit-choice ui-widget-content ui-state-default ui-corner-all tagit-choice-editable"></li>')
      $('li#state').insertBefore(".tagit-new").append('<span class="tagit-label">' + state + '</span>')
      $('li#state').append('<a class="tagit-close"</a>')
      $("li#state > a.tagit-close").append('<span class="text-icon"</span>')
      $("li#state > a.tagit-close").append('<span class="ui-icon ui-icon-close"</span>')
      // if ($("li#state").width() < 70) {
      //   $("li#state").css("margin-right", "100px")
      // }else {
      //   $("li#state").css("margin-right", "20px")
      // }
      setZoom(false,true, false)
      createSearchArray(abbr)
      $("li#state").on('click', function() { 
        d3.selectAll('li.tagit-choice').remove()
        $(".tagit-new").css("display", "block")
        d3.selectAll("path.selected")
          .classed("selected", false)
        d3.select("#location").html("National")
        setZoom(true,false, false)
        zoomMap(null, "national")
        createSearchArray("")
      })
    if (county != undefined) { 
      var newTag = $("ul.tagit").append('<li id="county" class="tagit-choice ui-widget-content ui-state-default ui-corner-all tagit-choice-editable"></li>')
      $('li#county').insertBefore(".tagit-new").append('<span class="tagit-label">' + county + '</span>')
      $('li#county').append('<a class="tagit-close"</a>')
      $("li#county > a.tagit-close").append('<span class="text-icon"</span>')
      $("li#county > a.tagit-close").append('<span class="ui-icon ui-icon-close"</span>')
      setZoom(false,true, true)
      $(".tagit-new").css("display", "none")
      $("li#county").on('click', function() {
        $(".tagit-new").css("display", "block")
        setZoom(false,true, false)
        var filteredData = tmp_state.filter(function(d) {
            return d.properties["state"] == state;
        })
        d3.select(this).remove()
        d3.select("#location").html(state)
        d3.selectAll(".counties > path.selected")
          .classed("selected", false)
        updateBars(SELECTED_VARIABLE, filteredData[0])
        updateTable(filteredData[0])
      })
    }
  }
  function updateTable(data) { 
    var data = (zoomNational == true) ? data : data["properties"];
    d3.selectAll("p.note1, p.note2").style("display", "none")
    d3.selectAll(".cell-data")
      .each(function(d,i) { 
        var rowVariable = [rowData[i]],
            rowVariable_nw = rowVariable + "_nw";
            rowVariable_wh = rowVariable + "_wh";
        if ((data[rowVariable]) == "n<50" || (data[rowVariable_nw]) == "n<50" || (data[rowVariable_wh]) == "n<50") { 
          d3.select("p.note1").style("display", "block")
        }
        if ((data[rowVariable]) == "N/A" || (data[rowVariable_nw]) == "N/A" || (data[rowVariable_wh]) == "N/A") {
          d3.select("p.note2").style("display", "block")
        }
        d3.select(this).selectAll("td")
          .text(function(d,i) { 
            if (i==0) { 
              if (isNaN(data[rowVariable]) == true) {
                return (data[rowVariable] == "n<50") ? "n/a*" : "n/a**"
              }else {
                return formatNumber(data[rowVariable]);
              }
            }else if (i==1){ 
              if (isNaN(data[rowVariable_wh]) == true) {
                return (data[rowVariable_wh] == "n<50") ? "n/a*" : "n/a**"
              }else {
                return formatNumber(data[rowVariable_wh]);
              }
            }else if (i==2) {
              if (isNaN(data[rowVariable_nw]) == true) {
                return (data[rowVariable_nw] == "n<50") ? "n/a*" : "n/a**"
              }else {
                return formatNumber(data[rowVariable_nw]);
              }
            }
          })
      })
  }
  function zoomMap(d,zoomLevel) { 
    var x, y, k;
    d3.select(".state-borders").selectAll("path")
      .classed("hide", false)
    // if (d.properties.state && centered !== d.properties.state && zoomLevel != "national") { 
    if (zoomLevel != "national") { 
      $('.zoomBtn').css("display", "block")
      $('.tagit-new > input').attr('placeholder', '')
      d3.select(".state-borders").selectAll("path:not(#" + d.properties.abbr+ ")")
        .classed("hide", true)
      d3.selectAll("path.hoverNational").classed("hoverNational", false)
      $(".state-borders").css("pointer-events", "none")
      $(".counties").css("pointer-events", "all")
      d3.selectAll("path").classed("selected", false)
      d3.select("path#" + d["properties"]["abbr"])
        .classed("selected", true)
        .moveToFront()
      d3.select("#location").html(d["properties"]["state"])
      setZoom(false, true, false)
      for (var i = 0; i < tmp_state.length; i++) {
        if (tmp_state[i]["properties"]["state"] == d.properties.state){
          selectedState = tmp_state[i]
        }
      }
      var centroid = path.centroid(selectedState); //replace with variable d to center by county 
      x = centroid[0];
      y = centroid[1];
      k = 4;
      centered = selectedState.properties.state;
      var data = (zoomLevel == "state") ? d3.select("path#" + selectedState.properties.abbr).datum() : d;
      updateTable(data)
      g.selectAll("path")
          .classed("active", centered && function(d) { return d === centered; });
      g.transition()
          .duration(750)
          .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")

      // centered = centered !== d && d;
      // console.log(centered)
      // var paths = svg.selectAll(".state-borders > path")
      //   .classed("active", d => d===centered);
      // var t0 = projection.translate(),
      //     s0 = projection.scale();
      // projection.fitSize([width, height], centered || states);

      // var interpolateTranslate = d3.interpolate(t0, projection.translate()),
      //     interpolateScale = d3.interpolate(s0, projection.scale());

      // var interpolator = function(t) {console.log(t)
      //   projection.scale(interpolateScale(t))
      //     .translate(interpolateTranslate(t));
      //   paths.attr("d", path);
      // };

      // d3.transition()
      //   .duration(750)
      //   .tween("projection", function() {
      //     return interpolator;
      //   });
      

      if (zoomLevel == "county") { 
          setZoom(false, true, true)
          d3.select("#location").html(d["properties"]["county"] + ", " + d["properties"]["abbr"])
          d3.selectAll("g.counties > path").classed("selected", false)
          d3.select("path#" + d["properties"]["abbr"] + d.id)
            .classed("selected", true)
            .moveToFront()
          // updateTable(data)
      }
    } else { 
      setZoom(true, false, false)
      $('.zoomBtn').css("display", "none")
      $('.tagit-new > input').attr('placeholder', 'Search for a state or county')
      $(".state-borders").css("pointer-events", "all")
      $(".counties").css("pointer-events", "none")
      x = width / 1.4;
      y = height / 1.5;
      k = .7;
      centered = null;
      updateTable(us_data)
      g.selectAll("path")
          .classed("active", centered && function(d) { return d === centered; });

      g.transition()
          .duration(750)
          .attr("transform", "translate(" + 0 + "," + height / 10 + ")scale(" +width/1060 + ")")
          // .style("stroke-width", 1.5 / k + "px");
    }
      updateBars(SELECTED_VARIABLE, d)

  }

  $(window).resize(function() { 
    var IS_MOBILE = d3.select("#isMobile").style("display") == "block";
    var IS_PHONE = d3.select("#isPhone").style("display") == "block";
    var barWidth = (IS_MOBILE) ? 45 : 50;
    var initialWidth = (IS_PHONE) ? $('body').width() : $("body").width() - $(".td-table").width()
    //    margin = (IS_PHONE) ? {top: 10, right: 30, bottom: 10, left: 30} : {top: 10, right: 31, bottom: 10, left: 55}
    setWidth(initialWidth)
    var width = tdMap,  //- margin.right-margin.left,
        height = (IS_PHONE) ? (width) - margin.top-margin.bottom :  630,//(width*.57) - margin.top-margin.bottom,       
        barSvgHeight = height/3.5
    if (IS_PHONE) { 
      d3.selectAll("#bar-chart-mobile").selectAll("svg")
        .each(function() { 
          d3.select(this)
            .attr("width", width)
            .attr("height", height/3)
        })

    }else {
      d3.select("#bar-chart").attr('width', width).attr("height", barSvgHeight)
      d3.select(".g-legend").attr('transform', 'translate(' + (width*.9) + ',' + 0 + ')')
      d3.select("g")          
        .attr("transform", "translate(" + 0 + "," + height / 10 + ")scale(" +width/1060 + ")")
 //.attr("transform", "scale(" + width/1060 + ")");
      $("table").height($("table").width()*0.8);
      d3.select("#map").select('svg')
        .attr('width', width)
        .attr('height', height)
      svg.select("rect")
        .attr('width', width)
        .attr('height', height)
      svg.select(".map-g")
          .attr("transform", "translate(" + 0 + "," + height / 10 + ")scale(" +width/1060 + ")")

      //  .attr("transform", "scale(" + width/1060 + ")");
      d3.selectAll(".bar-group")
        .each(function(d,i) {
          d3.select(this)
            .attr("transform", function() { 
              return "translate(" + ( (width/3 + 5) * i) + "," + (20) + ")";
            })
        })
      barG.selectAll('.category')
        .each(function(d,i) {
          d3.select(this)
            .attr("transform", function() {
              return (IS_MOBILE) ? "translate(" + (52 * i ) + "," + 10 + ")" : "translate(" + (60 * i ) + "," + 10 + ")"
            })
        })
      d3.selectAll(".zoomBtn")
        .each(function(d,i) {
          d3.select(this)
           .attr('transform', function() { 
            return 'translate(' + (width - 35) + ',' + (height - 80 + (i*40)) + ')'
            });
        })
      d3.select(".g-legend")
        .attr("height", height/2)
        .attr("width", function() {
          return (IS_MOBILE) ? 45 : 50;
        })
        .attr('transform', function() {
          return (IS_MOBILE) ? 'translate(' + (width- 68) + ',' + 10 + ')' : 'translate(' + (width- 55) + ',' + 10 + ')';
        })
      legend.select("rect")
        .attr("width", function() {
          return (IS_MOBILE) ? 73: 65
        })

      }
 
  })


};





