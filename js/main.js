var IS_MOBILE;
var IS_PHONE;
var IS_PHONESM;
var BREAKS ={"perc_debt_collect":[0.22, .31, .39, .49], "med_debt_collect":[1200, 1500, 1800, 2300], "perc_debt_med":[.11,.18,.26,.34], "med_debt_med":[500,700,950,1250], "perc_pop_nw":[.13,.28,.46,.67], "perc_pop_no_ins":[.08,.13,.18,.26], "avg_income":[52650,63850,77900,101050]}
var legendWidth = {"perc_debt_collect": 60, "perc_debt_med": 58, "med_debt_collect": 73, "med_debt_med": 70, "perc_pop_nw": 63, "perc_pop_no_ins": 60, "avg_income": 89}
// var legendTranslate = {"perc_debt_collect": width-60, "perc_debt_med": 644, "med_debt_collect": 628, "med_debt_med":631, "perc_pop_nw":638, "perc_pop_no_ins": 642, "avg_income":615}

var SELECTED_VARIABLE;
var WHITE;
var NONWHITE;
var COLORRANGE = ["#cfe8f3", "#73bfe2","#1696d2", "#0a4c6a", "#000000"];
var zoomState;
var zoomNational;
var zoomCounty;
var zoomNational_St;
var CATEGORY = "medical";
var tdMap;
var active = d3.select(null);
// var margin = (IS_PHONE) ? {top: 10, right: 30, bottom: 10, left: 30} : {top: 10, right: 31, bottom: 10, left: 55}

var dropdown;
var margin = (IS_PHONE) ? {top: 10, right: 30, bottom: 10, left: 30} : {top: 10, right: 0, bottom: 10, left: 45};

function setWidth(width, mobile, phone) { 
  var margin = phone ? {top: 10, right: 30, bottom: 10, left: 30} : {top: 10, right: 0, bottom: 10, left: 45};
  if ($("body").width() > 1200) {
    tdMap = 870 - margin.right - margin.left
  }else if ($("body").width() <= 1200 && !mobile){ 
    tdMap = width - margin.right -margin.left
  }else if (mobile && !phone) { 
    tdMap = width
  }else if (phone) {
    tdMap = width - margin.right -margin.left
  }
}

function setScreenState(mobile, phone, phonesm){
  IS_MOBILE = mobile
  IS_PHONE = phone
  IS_PHONESM = phonesm
}
setScreenState (d3.select("#isMobile").style("display") == "block", d3.select("#isPhone").style("display") == "block", d3.select("#isPhoneSm").style("display") == "block" )

function setVariable(variable, phone) {
  if (phone == true) {
    SELECTED_VARIABLE_ph = variable;
    WHITE_ph = variable + "_wh"
    NONWHITE_ph= variable + "_nw"
  }else {
    SELECTED_VARIABLE = variable;
    WHITE = variable + "_wh"
    NONWHITE= variable + "_nw"
  }

}
function setZoom(national, state, county, national_st) {
  zoomNational = national;
  zoomState = state;
  zoomCounty = county;
  zoomNational_St = national_st;
}

function selectedStatePh() {

}
var initialWidth = (IS_PHONE) ? $('body').width() : $("body").width() - $(".td-table").width() - 15
setWidth(initialWidth, IS_MOBILE, IS_PHONE)
setZoom(true,false, false)
setVariable("perc_debt_collect")
setVariable("perc_debt_collect", true)
var setHeight = tdMap*.7;
var width =  tdMap,  //(IS_MOBILE && !IS_PHONE) ? tdMap : (tdMap) - margin.right-margin.left,
    height = (IS_PHONE) ? (width) - margin.top-margin.bottom :  setHeight,//(width*.57) - margin.top-margin.bottom,     
    centered,
    selectedState,
    selectedStatePh,
    selectedCountyPh
// d3.json("https://d3js.org/us-10m.v1.json", function(error, us) {
//   if (error) throw error;
d3.queue()
    .defer(d3.json, "data/us-10m.v1.json")
    .defer(d3.csv, "data/county_" + CATEGORY + ".csv")
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
              e[property] = d.values[0][property]
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
  $("#location").html("National")
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
     $('input[name="tags"]').tagit("option", {
        availableTags: dropdown,
      })
    }
    $( "#searchBox" ).autocomplete({
      appendTo: ".search-div",
    });

    $('input[name="tags"]').tagit({
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
          ($(".search-div > .ui-widget").css("height", 60))
          var tag = (ui.tag[0]["textContent"]);
          var county = (tag.search(",") > 0) ? tag.split(",")[0] : "";
          var state = (tag.search(",") > 0) ? (tag.split(", ")[1]).slice(0,-1) : tag.slice(0,-1);
          var geoData = tmp_county 
          var geoType = (tag.search(",") > 0) ? "county" : "state";
          var geography = (geoType == "county") ? county : state;
          selectedLocation()
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
            if (geoType == "county") {
              return d.properties["county"] == county && d.properties["abbr"] == state;
            }else { 
              return d.properties["state"] == state;
            }
          })
          var data = filteredData[0]
          updateBars(SELECTED_VARIABLE, data)
          zoomMap(width, data, geoType)
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
            $("#location").html("National")
            d3.selectAll(".state-borders > path.selected")
              .classed("selected", false)
            setZoom(true, false, false)
            if (d3.select("li#state").size() == 0) {
              zoomMap(width, null, "national")
            }
           }
          updateBars(SELECTED_VARIABLE)
          createSearchArray("")

          $('.ui-widget-content.ui-autocomplete-input').attr('placeholder', 'Search for a state or county')

        }
    });
    $(".search-div > .ui-widget").css("height", 60)
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
    var categoryData = [{label: "Share with any debt in collections&#x207A;", variable: "perc_debt_collect"},
    {label: "Median debt in collections&#x207A;", variable: "med_debt_collect"},
    {label: "Share with medical debt in collections&#x207A;", variable: "perc_debt_med"},
    {label: "Median medical debt in collections&#x207A;", variable: "med_debt_med"},
    {label: "Nonwhite population share", variable: "perc_pop_nw"},
    {label: "Share without health insurance", variable: "perc_pop_no_ins" },
    {label: "Average household income", variable: "avg_income"}]
    
    var table = d3.select("#table-div")

    var stateMenu = d3.select(".state-menu")
      .on('click', function() {
        if ( d3.select(".state-menu.dropdown").classed("open") == true) {
          $("#state-select").selectmenu('close')
          d3.select(".state-menu.dropdown").classed("open", false)
        }else {
          d3.select(".state-menu.dropdown").classed("open", true)
          $("#state-select").selectmenu('open')
        }
      })
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
      .on('click', function() {
        if ( d3.select(".county-menu.dropdown").classed("open") == true) {
          $("#county-select").selectmenu('close')
          d3.select(".county-menu.dropdown").classed("open", false)
        }else {
          d3.select(".county-menu.dropdown").classed("open", true)
          $("#county-select").selectmenu('open')
        }
      })
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
        .on('click', function() {
          if ( d3.select(".category-menu.dropdown").classed("open") == true) {
            $("#category-select").selectmenu('close')
            d3.select(".category-menu.dropdown").classed("open", false)
          }else {
            d3.select(".category-menu.dropdown").classed("open", true)
            $("#category-select").selectmenu('open')
          }
        })
        .append("select")
        .attr("id", "category-select")
      var optionsCategory = categoryMenu
        .selectAll('option')
        .data(categoryData)
      optionsCategory.enter()
        .append('option')
        .html(function(d) {
          return d.label
        })
        .attr('value', function(d) {
          return d.variable
        })
  function reset() {
    active.classed("active", false);
    active = d3.select(null);

    g.transition()
        .duration(750)
        .style("stroke-width", "1.5px")
        .attr("transform", "");
  }
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
    selectedCountyPh = d3.select("#county-select-button").select(".ui-selectmenu-text").text()
    selectedStatePh = d3.select("#state-select-button").select(".ui-selectmenu-text").text()
    $(".ui-widget-content.ui-autocomplete-input").blur()
  }

  $("#state-select")
    .selectmenu({
      open: function(event,ui) {
        var dropdownWidth = $("#dropdown-div").width()
        var dropdownTop = $(".banner").height() + 113
        $(".ui-selectmenu-menu.ui-front.ui-selectmenu-open").css("top", dropdownTop + "px")
        $("ul#state-select-menu").css("width", dropdownWidth + "px")
        $("ul#state-select-menu").css("margin-left", "-137px")
        d3.select(".state-menu").select(".ui-icon")
          .classed("arrow-up", true)

      },
      close: function(event, ui) {
        d3.select(".state-menu").select(".ui-icon")
          .classed("arrow-up", false)
      },
      change: function(event, ui) {
        selectedLocation()
        var selectedState = ui.item.value
        if (selectedState != "USA") {
          $(".bar-State").css("display", "block")
          $(".label-State").css("display", "block")
          $(".bar-County").css("display", "none")
          $(".label-County").css("display", "none")
          d3.select(".county-menu").select(".ui-icon")
            .classed("greyed", false)
          var selectedPlace = ui.item.value
          var selectedCategory = $("#category-select").val()
          updateBars(selectedCategory, selectedPlace)
          d3.select(".group-label-ph2.State").text(selectedPlace)
          d3.select(".group-label-ph.State").text(selectedPlace)

        }else {
          $(".bar-County").css("display", "none")
          $(".bar-State").css("display", "none")
          $(".label-County").css("display", "none")
          $(".label-State").css("display", "none")
          d3.select(".county-menu").select(".ui-icon")
            .classed("greyed", true)

        }

        filterCountyMenu(selectedState)

      }
    })
    .selectmenu("menuWidget")
    .addClass("ui-menu-icons customicons")
  $("#county-select")
    .selectmenu({
      open: function(event,ui) {
        var dropdownWidth = $("#dropdown-div").width()
        var dropdownTop = $(".banner").height() + 175
        $(".ui-selectmenu-menu.ui-front.ui-selectmenu-open").css("top", dropdownTop + "px")
        $("ul#county-select-menu").css("width", dropdownWidth + "px")
        $("ul#county-select-menu").css("margin-left", "-137px")
        d3.select(".county-menu").select(".ui-icon")
          .classed("arrow-up", true)
      },
      close: function(event, ui) {
        d3.select(".county-menu").select(".ui-icon")
          .classed("arrow-up", false)
      },
      change: function(event, ui) {
        selectedLocation()
        $(".bar-County").css("display", "block")
        $(".label-County").css("display", "block")
        var selectedPlace = ui.item.value
        var selectedCategory = $("#category-select").val()
        updateBars(selectedCategory, selectedPlace)
        d3.select(".group-label-ph2.County").text(selectedPlace)
        d3.select(".group-label-ph.County").text(selectedPlace)

      }
    })
    .selectmenu("menuWidget")
    .addClass("ui-menu-icons customicons")
  $("#category-select")
    .selectmenu({
      open: function(event,ui) {
        var dropdownWidth = $("#dropdown-div").width()
        var dropdownTop = $(".banner").height() + 232
        $(".ui-selectmenu-menu.ui-front.ui-selectmenu-open").css("top", dropdownTop + "px")
        $("ul#category-select-menu").css("width", dropdownWidth + "px")
        $("ul#category-select-menu").css("margin-left", "-137px")
        d3.select(".category-menu").select(".ui-icon")
          .classed("arrow-up", true)
      },
      close: function(event, ui) {
        d3.select(".category-menu").select(".ui-icon")
          .classed("arrow-up", false)
      },
      change: function(event, ui) {
        var selectedCategory = ui.item.value
        selectedLocation()
        updateBars(selectedCategory, selectedStatePh)
        setVariable(selectedCategory, true)
        if (selectedCategory == "perc_pop_nw") {
          d3.selectAll(".bar-group-ph").selectAll(".category-ph.White").attr("display", "none")
          d3.selectAll(".bar-group-ph").selectAll(".category-ph.Nonwhite").attr("display", "none")
          d3.selectAll(".bar_ph").select("svg").attr("height", 80)
          d3.selectAll(".label").select(".svg2").attr("height", 38)
        }else {
          var bar_phHeight = (IS_PHONESM == true) ? 200 : 173; 
          d3.selectAll(".bar-group-ph").selectAll(".category-ph.White").attr("display", "block")
          d3.selectAll(".bar-group-ph").selectAll(".category-ph.Nonwhite").attr("display", "block")
          d3.selectAll(".bar_ph").select("svg").attr("height", bar_phHeight)
          d3.selectAll(".label").select(".svg2").attr("height", 130)

        }
      }
    })
    .selectmenu("menuWidget")
    .addClass("ui-menu-icons customicons")
  d3.select(".county-menu").select(".ui-icon")
    .classed("greyed", true)
  /*ADD MAP*/
    var svg = d3.select("#map")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("overflow", "hidden")

    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "background")
    
    // var projection = d3.geoAlbersUsa()
    var path = d3.geoPath()//.projection(projection)
    // var states = topojson.feature(us, us.objects.states);
    // projection.fitSize([width, height], states);
    var translateHeight = (IS_MOBILE) ? height*.05 : height*.05
    var mapScale = (IS_MOBILE) ? width/930 : width/1010
    var g = svg.append("g")
      .attr("class", "map-g")
      .attr("transform", "translate(" + (-10) + "," + (translateHeight) + ")scale(" +mapScale + ")")

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
          $(".tagit-new").css("display", "block")
          d3.select(this).classed('selected', false)
          if (level == "county") { 
            $('ul.tagit > li:nth-child(2)').remove()
            setZoom(false, true, false)
            updateTable(selectedState)
            updateBars(SELECTED_VARIABLE, d)
          }
        }else { 
          reset()
          var county = (level == "state") ? null : county;
          addTag(state, county, abbr)
          zoomMap(width, d, level)
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
          d3.select("#location").html(county + ", " + abbr )
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
        d3.selectAll(".selectedNational").classed("selectedNational", false)
        var state = d.properties.state;
        // var county = d.properties.county;
        var abbr = d.properties.abbr;
        var level = "state"
        setZoom(false, true, false)
        // $(".state-borders").css("pointer-events", "none")
        // $(".counties").css("pointer-events", "all")
        addTag(state, null, abbr)
        zoomMap(width, d, level)
        updateBars(SELECTED_VARIABLE, d)
      })
      .on('mouseover', function(d) { 
        if (zoomNational == true || zoomNational_St == true) { 
          // $(".state-borders").css("pointer-events", "all")
          // $(".counties").css("pointer-events", "none")
            hoverLocation("", d.properties.abbr, "state");
          updateBars(SELECTED_VARIABLE, d) 
        }else {
          // $(".state-borders").css("pointer-events", "none")
          // $(".counties").css("pointer-events", "all")

        }
      })
      .on('mouseleave', function(d) { 
        if (zoomNational==true || zoomNational_St == true) {
          if (d3.select(".state-borders > path.selected").node() != undefined && zoomNational_St != true) {
            var state = d3.select(".state-borders > path.selected").datum().properties.state
            d3.select("#location").html(state)
            d3.selectAll("path.selected").moveToFront()
          }else if (zoomNational_St == true){ 
            d3.selectAll(".hover")
              .classed("hover", false)
              .classed("hoverNational", false)
            d3.selectAll("path.selected").moveToFront()
            var selected = (d3.select(".counties > path.selected").size() > 0) ? d3.select(".counties > path.selected").datum() : d3.select(".state-borders > path.selected").datum()
            var geography = (d3.select(".counties > path.selected").size() > 0) ? selected.properties["county"] + ", " + selected.properties["abbr"] : selected.properties["state"];
            d3.select('#location').html(geography)
            updateBars(SELECTED_VARIABLE, selected)
          }else { 
            d3.select('#location').html("National")
            d3.selectAll(".hover")
              .classed("hover", false)
              .classed("hoverNational", false)
            updateBars(SELECTED_VARIABLE, undefined)
          }
        }
      })
      .on('mouseout', function(d) { 
        if (zoomNational==true || zoomNational_St == true) {
          if (d3.select(".state-borders > path.selected").node() != undefined && zoomNational_St != true) {
            var state = d3.select(".state-borders > path.selected").datum().properties.state
            d3.select("#location").html(state)
            d3.selectAll("path.selected").moveToFront()
          }else if (zoomNational_St == true){ 
            d3.selectAll(".hover")
              .classed("hover", false)
              .classed("hoverNational", false)
            d3.selectAll("path.selected").moveToFront()
            var selected = (d3.select(".counties > path.selected").size() > 0) ? d3.select(".counties > path.selected").datum() : d3.select(".state-borders > path.selected").datum()
            var geography = (d3.select(".counties > path.selected").size() > 0) ? selected.properties["county"] + ", " + selected.properties["abbr"] : selected.properties["state"];
            d3.select('#location').html(geography)
            updateBars(SELECTED_VARIABLE, selected)
          }else { 
            d3.select('#location').html("National")
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
        setZoom(false, false, false, true)
        zoomMap(width, null, "national")
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
  /*MOBILE*/
  var svgPh = d3.select("#legend-div")
    .append("svg")
    .attr("width", width*.95)
    .attr("height", 60)
  var legendPh = svgPh
    .append("g")
    .attr("class", "g-legend-ph")
    // .attr('transform', function() {
    //   return (IS_MOBILE) ? 'translate(' + (width- 68) + ',' + 10 + ')' : 'translate(' + (width- 55) + ',' + 20 + ')';
    // })
  legendPh.append("text")
    .text("All:")
    .attr("class", "legend-title")
    .attr("x", 12)
    .attr("y", 17)
  // legendPh.append("text")
  var keyWidthPh =   width/8;
  var keyHeightPh =  15;
  for (i=0; i<=6; i++){
    if(i  < 5){  
      legendPh.append("rect")
        .attr("width",keyWidthPh)
        .attr("height",keyHeightPh)
        .attr("class","rect"+i)
        .attr("x",keyWidthPh*i + 50)
        .attr("y", 5)
        .style("fill", COLORRANGE[i])
      legendPh.append("text")
        .attr("y", 34)
        .attr("class","legend-labels-ph legend-labels-ph" + i)
        .attr("x",keyWidthPh*i + 55)
        .attr("text-anchor", "middle")
        .text(function(){
          var min = d3.min(tmp_county, function(d) { 
            return d.properties[SELECTED_VARIABLE]
          })
          var array = BREAKS[SELECTED_VARIABLE]
          return (i==0) ? formatNumber(min, "min") : formatNumber((array[i-1]))
        })
     }
    if(i==6){  
      legendPh.append("rect")
        .attr("width",keyWidthPh)
        .attr("height",keyHeightPh)
        .attr("class","rect"+i)
        .attr("x",keyWidthPh*i + 17)
        .attr("y", 5)
        .style("fill","#ADABAC")
      legendPh.append("text")
        .attr("y", 34)
        .attr("class","legend-labels-ph legend-labels-ph" + i)
        .attr("x",keyWidthPh*i + 45)
        .attr("text-anchor", "middle")
        .text("n/a")

     }
     if (i == 5) { 
      legendPh.append("text")
        .attr("y", 34)
        .attr("class","legend-labels-ph legend-labels-ph" + i)
        .attr("text-anchor", "end")
        .attr("x",keyWidthPh*i + 55 )
        .attr("text-anchor", "middle")
        .text(function(){
          var max = d3.max(tmp_county, function(d) { 
            return d.properties[SELECTED_VARIABLE]
          })
          return formatNumber(max, "max")
        })
      }
    }
 
  /*DESKTOP*/
  svg.append("rect")
    .attr("width", function() { 
      return (IS_MOBILE) ? 73: 57
    })
    .attr("class", "rect-div")
    .attr("height", 215)
    .style("fill", "#f5f5f5")
    .style("opacity", 0.8)
    .attr('transform', 'translate(' + (width- 54) + ',' + (-1) + ')')
  var legend = svg
    .append("g")
    .attr("class", "g-legend")
    .attr('transform', 'translate(' + (width- 55) + ',' + 20 + ')')
  legend.append("text")
    .text("All")
    .attr("class", " ftitle")
    .attr("x", 33)
    .attr("text-anchor", "end")
  legend.append("text")
  var keyWidth =   10;
  var keyHeight =  25;
  for (i=0; i<=6; i++){
    if(i <5){  
      legend.append("rect")
        .attr("width",keyWidth)
        .attr("height",keyHeight)
        .attr("class","rect"+i)
        .attr("y",keyHeight*i + 23)
        .attr("x", 38)
        .style("fill", COLORRANGE[i])
        // .on("mouseover",function(){ mouseEvent({type: "Legend", "class": (d3.select(this).attr("class"))}, "hover") })
        // .on("mouseleave", function(){
        //   d3.selectAll(".demphasized").classed("demphasized",false)
        // })
    //     .on("click",function(){ mouseEvent(dataID, {type: "Legend", "class": "q" + (this.getAttribute("x")/keyWidth) + "-4"}, "click") })
      legend.append("text")
        .attr("x", 33)
        .attr("class","legend-labels " + i)
        .attr("y",keyHeight*i + 23)
        .attr("text-anchor", "end")
        .text(function(){
          var min = d3.min(tmp_county, function(d) { 
            return d.properties[SELECTED_VARIABLE]
          })
          var array = BREAKS[SELECTED_VARIABLE]
          return (i==0) ? formatNumber(min, "min") : formatNumber((array[i-1]))
        })
     }
    if(i==6){  
      legend.append("rect")
        .attr("width",keyWidth)
        .attr("height",keyHeight)
        .attr("class","rect"+i)
        .attr("y",keyHeight*i + 10)
        .attr("x", 38)
        .style("fill", "#ADABAC")
        // .on("mouseover",function(){ mouseEvent({type: "Legend", "class": (d3.select(this).attr("class"))}, "hover") })
        // .on("mouseleave", function(){
        //   d3.selectAll(".demphasized").classed("demphasized",false)
        // })
    //     .on("click",function(){ mouseEvent(dataID, {type: "Legend", "class": "q" + (this.getAttribute("x")/keyWidth) + "-4"}, "click") })
      legend.append("text")
        .attr("x", 33)
        .attr("class","legend-labels " + i)
        .attr("y",keyHeight*i + 28)
        .attr("text-anchor", "end")
        .text("n/a")
     }
     if (i == 5) { 
      legend.append("text")
        .attr("x", 33)
        .attr("class","legend-labels " + i)
        .attr("text-anchor", "end")
        .attr("y",keyHeight*i + 23)
        .text(function(){
          var max = d3.max(tmp_county, function(d) { 
            return d.properties[SELECTED_VARIABLE]
          })
          return formatNumber(max, "max")
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
    var data =  tmp_county;
    var filteredData = data.filter(function(d){ 
      if (geography == "county") {
        return d.properties.county == county && d.properties.abbr == state
      }else { 
        return d.properties.abbr == state
      }
    })
    d3.select("#location").html(function() { 
      return (geography=="county") ?  filteredData[0]["properties"]["county"] + ", " + filteredData[0]["properties"]["abbr"] : filteredData[0]["properties"]["state"] 
    })
    var id = (geography == "county") ? filteredData[0]["id"] : ""
    if ( d3.select("path#" + filteredData[0]["properties"]["abbr"] + id).classed("hover") == true) {
    }else {
      d3.select("path#" + filteredData[0]["properties"]["abbr"] + id)
        .classed('hover', true)
        .classed('hide', false)
        .classed("hoverNational", function() {
          return (zoomNational == true || zoomNational_St) ? true : false
        })
        .moveToFront()
    }
  }

      // .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
      // .attr("id", "state-borders")
      // .attr("d", path)

  /*ADD TABLE*/
    $("#table-div").empty()
    var columns = ["All", "White", "NonWhite"]
    var groups = ["Share with any debt in collections<span class=\"large\">&#x207A;</span>", "Median debt in collections<span class=\"large\">&#x207A;</span>", "Share with medical debt in collections<span class=\"large\">&#x207A;</span>", "Median medical debt in collections<span class=\"large\">&#x207A;</span>","Nonwhite population share", "Share without health insurance coverage","Average household income"]
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
            // if (d == "med_debt_collect"|| d=="med_debt_med") {
            //   d3.select(".rect-div")
            //     .attr("width", 73)
            //     .attr('transform', 'translate(' + (width- 72) + ',' + (-1) + ')')
            // }else if (d == "med_debt_collect"|| d=="med_debt_med") {
            //   d3.select(".rect-div")
            //     .attr("width", 85)
            //     .attr('transform', 'translate(' + (width- 83) + ',' + (-1) + ')')
            // }else if (d == "avg_income") {
            //   d3.select(".rect-div")
            //     .attr("width", 89)
            //     .attr('transform', 'translate(' + (width- 85) + ',' + (-1) + ')')
            // }else {
              d3.select(".rect-div")
              .attr("width", function() {
                return (IS_MOBILE) ? 73: legendWidth[d]
              })
              .attr('transform', 'translate(' + (width - legendWidth[d]) + ',' + (-1) + ')')
            // }
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
          .html(function() { 
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
  var categories = ["All", "White", "Nonwhite"]
  var barData = [{data: us_data_ph[0]}, {data: us_data_ph[0]}, {data: us_data_ph[0]} ]
    /*MOBILE*/
  var barSvgHeight_ph = (IS_PHONESM) ? 200 : 173;
  var barWidth_ph = (IS_PHONESM) ? width : width*.85;
  var x_ph = d3.scaleLinear().range([0, barWidth_ph]);
  var y_ph = d3.scaleBand().range([30, 0]);
  // x_ph.domain([0, d3.max(state_data, function(d) { return d[SELECTED_VARIABLE]; })]);
  x_ph.domain([0, d3.max(county_data, function(d) {
    if (isNaN(d[NONWHITE_ph]) == true && isNaN(d[WHITE_ph]) == true){
      return d[SELECTED_VARIABLE_ph]
    }else if (isNaN(d[NONWHITE_ph]) == true && isNaN(d[WHITE_ph]) == false) {
      return Math.max(d[WHITE_ph], d[SELECTED_VARIABLE_ph])
    }else if (isNaN(d[WHITE_ph]) == true && isNaN(d[NONWHITE_ph]) == false) {
      return Math.max(d[NONWHITE_ph], d[SELECTED_VARIABLE_ph])
    }else {
      return Math.max(d[WHITE_ph], d[NONWHITE_ph], d[SELECTED_VARIABLE_ph])
    }
  })])
  y_ph.domain(us_data_ph.map(function(d) { return d[SELECTED_VARIABLE_ph]; }));
  var xAxis_ph = d3.axisBottom()
      .scale(x_ph)
      .ticks(0)
  var yAxis_ph = d3.axisLeft()
      .scale(y_ph)
      .ticks(0)
  for (i=0; i<=groups_ph.length - 1; i++){
    var group = groups_ph[i]
    var category = categories[i]
    d3.select(".label-" + group )
      .append("svg")
      .attr("width", 200)
      .attr("height", 20)
      .append("text")
      .text(group)
      .attr("class", function() {
        return "group-label-ph " + group
      })
      .attr("transform", "translate(" + 15 + "," + 15 + ")")
      .attr("text-anchor", "start")
    var barLabel = d3.select(".label-" + group )
      .append("svg")
      .attr("width", 82)
      .attr("height", 130)
      .attr("class", "svg2")

    // barLabel.append("text")
    //   .text(function(d,i) {
    //     return group;
    //   })
    //   .attr("transform", "translate(" + 74 + "," + 20 + ")")
    //   .attr("text-anchor", "end")
    //   .attr("class", function() {
    //     return "group-label-ph " + group
    //   })
    barLabel.selectAll("g")
      .data(categories)
      .enter()
      .append("g")
      .append("text")
      .text(function(d,i) {
        return categories[i]
      })
      .attr("class", "category-labels-ph")
      .attr("transform", function(d,i) {
        return (IS_PHONESM) ? "translate(" + 0 + "," + (52*i + 57) + ")" : "translate(" + 74 + "," + (40*i + 25) + ")";
      })
      .attr("text-anchor", "end")

    d3.select(".bar-" + group )
      .append("svg")
      .attr("width", barWidth_ph)
      .attr("height", barSvgHeight_ph)
    var barG_ph = d3.select(".bar-" + group).select("svg").append("g")
      .attr("class", function(d,i) {
        return "bar-group-ph " + group
      })
      .attr("transform", function(d,i) {
        return (IS_PHONESM) ? "translate(" + 0 + "," + (20) + ")" : "translate(" + 0 + "," + 0 + ")";
      })
    barG_ph.append("text")
      .text(function(d,i) {
        return group;
      })
      .attr("class", function(d,i) {
        return "group-label-ph2 " + group
      })
    barG_ph.append("text")
      .attr("class", "group-label-2")
      .attr("transform", function(d,i) {
        var width = (d3.select(".group-label-ph2." + group).node().getBoundingClientRect().width) + 5
        return "translate(" + width + "," + 0 + ")"
      })

    var subBarPh = barG_ph.selectAll("g")
      .data(categories)
      .enter()
      .append("g")
      .attr("class", function(d,i) {
        return "category-ph " + categories[i]
      })
      .attr("transform", function(d,i) {
        return (IS_PHONESM) ? "translate(" + 0 + "," + (52*i) + ")" : "translate(" + 0 + "," + (40*i) + ")";
      })

    d3.selectAll(".bar-County, .bar-State, .label-County, .label-State")
      .style("display", "none")

    var rectG_ph = subBarPh.append("g")
      .attr("class", function(d) { 
        return "rect-g " + d})
      .attr("transform", function(d,i) {
        return "translate(" + 0 +"," + 28+ ")"
      })
    rectG_ph.append("g")
      .data(barData)
      .append("text")
      .attr("class", "data-label-ph")
      .attr("y", 12)
      .attr("dy", ".71em")
      // .attr("transform", function(d,i) {
      //   return "translate(" + (barWidth_ph-33) +"," + 0+ ")"
      // })
    rectG_ph.selectAll(".data-label-ph")
      .data([us_data])
      .attr("x", function(d) { 
        var parentClass = $(this).closest(".rect-g").attr("class")
        if (parentClass.search("All") > -1) { 
          return x_ph(d[SELECTED_VARIABLE_ph]) + 5
        }else if (parentClass.search("Non") > -1) {
          return x_ph(d[NONWHITE_ph]) + 5
        }else{
          return x_ph(d[WHITE_ph]) + 5
        }
      })
      .text(function(d) { 
        var parentClass = $(this).closest(".rect-g").attr("class")
        if (parentClass.search("All") > -1) { 
          return formatNumber(d[SELECTED_VARIABLE_ph])
        }else if (parentClass.search("Non") > -1) {
          return formatNumber(d[NONWHITE_ph])
        }else{
          return formatNumber(d[WHITE_ph])
        }
      })
    rectG_ph
      .append("g")
      .attr("class", "g-text-ph")
      .append("text")
      .attr("x", 0)
      .attr("y", -13)
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
    rectG_ph.selectAll("rect")
      .data(us_data_ph)
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("class", "bar-ph")
      .attr("height", y_ph.bandwidth())
      .attr("width", function(d) { 
        var parentClass = d3.select(this.parentNode).attr('class');
        if (parentClass.search("All") > -1) {
          return x_ph(d[SELECTED_VARIABLE_ph])
        }else if (parentClass.search("Non") > -1) {
          return x_ph(d[NONWHITE_ph])
        }else{
          return x_ph(d[WHITE_ph])
        }
      })
      .attr("fill", function(d) { 
        var parentClass = d3.select(this.parentNode).attr('class');
        if (parentClass.search("All") > -1) {
          return "#fdbf11"
        }else if (parentClass.search("Non") > -1) {
          return "#696969"
        }else{
          return "#000000"
        }
      })
  }

    /*DESKTOP*/


    var barSvgHeight = (IS_MOBILE) ? 185 : 130;
    var barHeight = (IS_MOBILE) ? 90 : 65;
    var barWidth = (IS_MOBILE) ? 42 : 50;
    var x = d3.scaleBand()
      .rangeRound([0, barWidth])

    var y = d3.scaleLinear()
        .rangeRound([barHeight, 0]);
    county_data.forEach(function(d) { 
      d.national = +d.values[0][SELECTED_VARIABLE]
    })
    county_data.forEach(function(d) { 
      d.white = +d.values[0][WHITE];
    })
    county_data.forEach(function(d) { 
      d.nonwhite = +d.values[0][NONWHITE]
    })
    x.domain([[us_data].map(function(d){ 
      return d.abbr
    })]);
    y.domain([0, d3.max(county_data, function(d) {
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
    var chartPadding = (IS_MOBILE) ? 15 : 0;
    var barSvg = d3.select("#bar-chart")
      .append("svg")
      .attr('width', width - chartPadding)
      .attr('height', barSvgHeight)
    var barG = barSvg.selectAll("g")
      .data(groups)
      .enter()
      .append('g')
      .attr("transform", function(d,i) {
        return "translate(" + ( (width/3.1 + 5) * i) + "," + (20) + ")";
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
        return (IS_MOBILE) ? "translate(" + ((barWidth + 2) * i ) + "," + 10 + ")" : "translate(" + (60 * i ) + "," + 10 + ")"
      })
    
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

    //add bars
    rectG.selectAll("rect")
      .data([us_data])
      .enter()
      .append("rect")
      .attr("x", function(d) { 
        return d.abbr
      })
      .attr("class", "bar")
      .attr("fill", function(d) { 
        var parentClass = d3.select(this.parentNode).attr('class');
        if (parentClass.search("All") > -1) {
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
        if (parentClass.search("All") > -1) {
          return y(d[SELECTED_VARIABLE])
        }else if (parentClass.search("Non") > -1) {
          return y(d[NONWHITE])
        }else{
          return y(d[WHITE])
        }
      })
      .attr("height", function(d) {
        var parentClass = d3.select(this.parentNode).attr('class');
        if (parentClass.search("All") > -1) {
          return barHeight - y(d[SELECTED_VARIABLE])
        }else if (parentClass.search("Non") > -1){
          return barHeight - y(d[NONWHITE])
        }else{
          return barHeight - y(d[WHITE])
        }
      })
    d3.selectAll(".rect-g")
      .each(function(d,i) {
        d3.select(this)
        .data([us_data])
        .append("text")
        .attr("class", "bar-text")
        .attr("x", 0)
        .attr("y", function(d) {
          var parentClass = d3.select(this.parentNode).attr('class');
          if (parentClass.search("All") > -1) {
            return y(d[SELECTED_VARIABLE]) - 16
          }else if (parentClass.search("Non") > -1) {
            return y(d[NONWHITE]) - 16
          }else{
            return y(d[WHITE]) - 16
          }
        })
        .attr("dy", ".71em")
        .attr("text-anchor", "start")
        .attr("class", "data-label")
        .text(function(d) { 
          var parentClass = d3.select(this.parentNode).attr('class');
          if (parentClass.search("All") > -1) {
            return formatNumber(d[SELECTED_VARIABLE])
          }else if (parentClass.search("Non") > -1) {
            return formatNumber(d[NONWHITE])
          }else{
            return formatNumber(d[WHITE])
          }
        })
      })

    // d3.selectAll(".bar-text")
    //   .each(function(d,i) {console.log(i)
    //     d3.select(this)
    //       .classed(categories[i], true)
    //   })

    // barText
    //   .append("text")


    d3.selectAll("#State, #County").style("opacity", 0)

  function formatNumber(d, type) { 
    var percent = d3.format(",.0%"),
        number = d3.format("$,.0f");
    if (type == "max") {
      return (d<1) ? percent(Math.ceil(d * 10) / 10 ) : number( Math.ceil((d+1)/10)*10)
    }else if (type == "min") {
      return (d<1) ? percent(Math.floor(d * 100) / 100 ) : number( Math.floor((d+1)/10)*10)
    }else {
      return (d<1) ? percent(d) : number(d);
    }
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
        if (i != 6) {
        d3.select(this)
          .text(function(){
            var min = d3.min(tmp_county, function(d) {
              return d.properties[variable]
            })
            var max = d3.max(tmp_county, function(d) {
              return d.properties[variable]
            })
            var array = BREAKS[variable]
            if (i==0) {
              return formatNumber(min, "min")
            }else if (i==5) {
              return formatNumber(max, "max")
            }else { 
              return formatNumber(array[i-1])
            }
          })
        }

      })

      d3.selectAll(".legend-labels-ph")
      .each(function(d,i) {
        if (i != 6) {
        d3.select(this)
          .text(function(){
            var min = d3.min(tmp_county, function(d) {
              return d.properties[variable]
            })
            var max = d3.max(tmp_county, function(d) {
              return d.properties[variable]
            })
            var array = BREAKS[variable]
            if (i==0) {
              return formatNumber(min, "min")
            }else if (i==5) {
              return formatNumber(max, "max")
            }else { 
              return formatNumber(array[i-1])
            }
          })
        }
      })
    d3.select(".counties").selectAll("path")
    .transition()
    .duration(800)
    .style("fill", function(d){
        return (isNaN(d.properties[variable]) == true) ? "#adabac" : quantize(d.properties[variable]);
    })
    var selected = (d3.select("path.selected").node() != null) ? (d3.select("path.selected").datum()) : undefined
    updateBars(variable, selected)
    //REMOVE WHITE AND NONWHITE BARS IF NONWHITE POP VARIABLE IS SELECTED
    if (variable == "perc_pop_nw") {
      d3.select("#County").selectAll(".White, .Nonwhite").style("opacity", 0)
      d3.select("#State").selectAll(".White, .Nonwhite").style("opacity", 0)
      d3.select("#National").selectAll(".White, .Nonwhite").style("opacity", 0)
    }else {
      d3.select("#County").selectAll(".White, .Nonwhite").style("opacity", 1)
      d3.select("#State").selectAll(".White, .Nonwhite").style("opacity", 1)
      d3.select("#National").selectAll(".White, .Nonwhite").style("opacity", 1)
    }
  }

  function updateBars(variable, selected) { 
    d3.select("#notes-section").selectAll("p.note2, p.note1").style("opacity", 0)
    // d3.selectAll(".note-header").html("<b>Note:</b>")

    var WHITE_ph = variable + "_wh"
    var NONWHITE_ph = variable + "_nw"
    var data = county_data;
    /**MOBILE**/
    if (IS_PHONE) { 
      var state_data_ph = state_data.filter(function(d) {
        return d.state == selectedStatePh
      })
      var county_data_ph = county_data.filter(function(d) {
        return d.county == selectedCountyPh && d.state == selectedStatePh
      })
      x_ph.domain([0, d3.max(data, function(d) {
        if (isNaN(d[NONWHITE_ph]) == true && isNaN(d[WHITE_ph]) == true){
          return d[variable]
        }else if (isNaN(d[NONWHITE_ph]) == true && isNaN(d[WHITE_ph]) == false) {
          return Math.max(d[WHITE_ph], d[variable])
        }else if (isNaN(d[WHITE_ph] == true && isNaN(d[NONWHITE_ph])) == false) {
          return Math.max(d[NONWHITE_ph], d[variable])
        }else {
          return Math.max(d[WHITE_ph], d[NONWHITE_ph], d[variable])
        }
      })])
      var National = d3.select(".bar-group-ph.National").selectAll(".category-ph")
      National
        .each(function() {
          d3.select(this).select(".bar-ph")
            .data(us_data_ph)
            .transition()
            .duration(300)
            .attr("width", function(d) { 
              var parentClass = d3.select(this.parentNode).attr('class');
              if (parentClass.search("All") > -1) {
                return (isNaN(d[variable]) != true) ? x_ph(d[variable]) : 0
              }else if (parentClass.search("Non") > -1) {
                return (isNaN(d[NONWHITE_ph]) != true) ?  x_ph(d[NONWHITE_ph]) : 0
              }else{
                return (isNaN(d[WHITE_ph]) != true) ?  x_ph(d[WHITE_ph]) : 0
              }
            })
          d3.select(this).select(".data-label-ph")
            .data(us_data_ph)
            .attr("x", function(d) { 
              var parentClass = $(this).closest(".rect-g").attr("class")
              if (parentClass.search("All") > -1) {
                return (isNaN(d[variable]) != true) ? x_ph(d[variable]) + 5 : 0
              }else if (parentClass.search("Non") > -1) {
                return (isNaN(d[NONWHITE_ph]) != true) ? x_ph(d[NONWHITE_ph]) + 5 : 0
              }else{
                return (isNaN(d[WHITE_ph]) != true) ? x_ph(d[WHITE_ph]) + 5 : 0
              }
            })
            .attr("y", 12)
            .text(function(d) { 
              var parentClass = $(this).closest(".rect-g").attr("class")
              if (parentClass.search("All") > -1) { 
                var noData = (d[variable] == "n<50") ? "n/a*" : "n/a**"
                var noData_wh = (d[WHITE_ph] == "n<50") ? "n/a*" : "n/a**"
                var noData_nw = (d[NONWHITE_ph] == "n<50") ? "n/a*" : "n/a**"
                if (d[NONWHITE_ph] == "n<50" || (d[WHITE_ph]) == "n<50" || (d[variable]) == "n<50") { 
                  d3.select("#notes-section > p.note1").style("opacity", 1)
                }
                if ((d[variable]) == "N/A" || (d[NONWHITE_ph]) == "N/A" || (d[WHITE_ph]) == "N/A") {
                  d3.select("#notes-section > p.note2").style("opacity", 1)
                }
                return (isNaN(d[variable]) != true) ? formatNumber(d[variable]) : noData
              }else if (parentClass.search("Non") > -1) {
                return (isNaN(d[NONWHITE_ph]) != true) ? formatNumber(d[NONWHITE_ph]) : noData_nw
              }else{
                return (isNaN(d[WHITE_ph]) != true) ? formatNumber(d[WHITE_ph]) : noData_wh
              }
            })
        })

      var State = d3.select(".bar-group-ph.State").selectAll(".category-ph")
      State
        .each(function() {
          d3.select(this).select(".bar-ph")
            .data(state_data_ph)
            .transition()
            .duration(300)
            // .attr("height", y_ph.bandwidth())
            .attr("width", function(d) { 
              var parentClass = d3.select(this.parentNode).attr('class');
              if (parentClass.search("All") > -1) { 
                return (isNaN(d[variable]) != true) ? x_ph(d[variable]) : 0
              }else if (parentClass.search("Non") > -1) {
                return (isNaN(d[NONWHITE_ph]) != true) ?x_ph(d[NONWHITE_ph]) : 0
              }else{
                return (isNaN(d[WHITE_ph]) != true) ? x_ph(d[WHITE_ph]) : 0
              }
            })
          d3.select(this).select(".data-label-ph")
            .data(state_data_ph)
            .attr("x", function(d) { 
              var parentClass = $(this).closest(".rect-g").attr("class")
              if (parentClass.search("All") > -1) {
                return (isNaN(d[variable]) != true) ? x_ph(d[variable]) + 5 : 0
              }else if (parentClass.search("Non") > -1) { 
                return (isNaN(d[NONWHITE_ph]) != true) ? x_ph(d[NONWHITE_ph]) + 5 : 0
              }else{
                return (isNaN(d[WHITE_ph]) != true) ? x_ph(d[WHITE_ph]) + 5 : 0
              }
            })
            .text(function(d) { 
              var noData = (d[variable] == "n<50") ? "n/a*" : "n/a**"
              var noData_wh = (d[WHITE_ph] == "n<50") ? "n/a*" : "n/a**"
              var noData_nw = (d[NONWHITE_ph] == "n<50") ? "n/a*" : "n/a**"
              var parentClass = $(this).closest(".rect-g").attr("class")
              if (d[NONWHITE_ph] == "n<50" || (d[WHITE_ph]) == "n<50" || (d[variable]) == "n<50") { 
                d3.select("#notes-section > p.note1").style("opacity", 1)

              }
              if ((d[variable]) == "N/A" || (d[NONWHITE_ph]) == "N/A" || (d[WHITE_ph]) == "N/A") {
                d3.select("#notes-section > p.note2").style("opacity", 1)
              }
              if (parentClass.search("All") > -1) { 
                return (isNaN(d[variable]) != true) ? formatNumber(d[variable]) : noData
              }else if (parentClass.search("Non") > -1) {
                return (isNaN(d[NONWHITE_ph]) != true) ? formatNumber(d[NONWHITE_ph]) : noData_nw
              }else{
                return (isNaN(d[WHITE_ph]) != true) ? formatNumber(d[WHITE_ph]) : noData_wh
              }
            })
        })
      if (selectedCountyPh != "") {
        var County = d3.select(".bar-group-ph.County").selectAll(".category-ph")
        County
          .each(function() {
            d3.select(this).select(".bar-ph")
              .data(county_data_ph)
              .transition()
              .duration(300)
              // .attr("height", y_ph.bandwidth())
              .attr("width", function(d) { 
                var parentClass = d3.select(this.parentNode).attr('class');
                if (parentClass.search("All") > -1) { 
                  return (isNaN(d[variable]) != true) ? x_ph(d[variable]) : 0
                }else if (parentClass.search("Non") > -1) {
                  return (isNaN(d[NONWHITE_ph]) != true) ? x_ph(d[NONWHITE_ph]) : 0
                }else{
                  return (isNaN(d[WHITE_ph]) != true) ? x_ph(d[WHITE_ph]) : 0
                }
              })
            d3.select(this).select(".data-label-ph")
              .data(county_data_ph)
              .attr("x", function(d) { 
                var parentClass = $(this).closest(".rect-g").attr("class")
                if (parentClass.search("All") > -1) {
                  return (isNaN(d[variable]) != true) ? x_ph(d[variable]) + 5 : 0
                }else if (parentClass.search("Non") > -1) {
                  return (isNaN(d[NONWHITE_ph]) != true) ? x_ph(d[NONWHITE_ph]) + 5 : 0
                }else{
                  return (isNaN(d[WHITE_ph]) != true) ? x_ph(d[WHITE_ph]) + 5 : 0
                }
              })
              .text(function(d) { 
                var noData = (d[variable] == "n<50") ? "n/a*" : "n/a**"
                var noData_wh = (d[WHITE_ph] == "n<50") ? "n/a*" : "n/a**"
                var noData_nw = (d[NONWHITE_ph] == "n<50") ? "n/a*" : "n/a**"
                if (d[NONWHITE_ph] == "n<50" || (d[WHITE_ph]) == "n<50" || (d[variable]) == "n<50") { 
                  d3.select("#notes-section > p.note1").style("opacity", 1)
                }
                if ((d[variable]) == "N/A" || (d[NONWHITE_ph]) == "N/A" || (d[WHITE_ph]) == "N/A") {
                  d3.select("#notes-section > p.note2").style("opacity", 1)
                }
                var parentClass = $(this).closest(".rect-g").attr("class")
                if (parentClass.search("All") > -1) { 
                  return (isNaN(d[variable]) != true) ? formatNumber(d[variable]) : noData
                }else if (parentClass.search("Non") > -1) {
                  return (isNaN(d[NONWHITE_ph]) != true) ? formatNumber(d[NONWHITE_ph]) : noData_nw
                }else{
                  return (isNaN(d[WHITE_ph]) != true) ? formatNumber(d[WHITE_ph]) : noData_wh
                }
              })
          })
      }
    }else {
      /*DESKTOP*/
    var data =  county_data;
    // var data = (zoomCounty == true) ? county_data : state_data;
    var x = d3.scaleBand()
      .rangeRound([0, barWidth])
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

      var National = d3.select("#National").selectAll(".category")
      National
        .each(function() {
          d3.select(this).select(".bar")
            .data([us_data])
            .transition()
            .duration(300)
            .attr("y", function(d) {  
              var parentClass = d3.select(this.parentNode).attr('class');
              if (parentClass.search("All") > -1) { 
                return (isNaN(d[variable]) != true) ? y(d[variable]) : barHeight;
              }else if (parentClass.search("Non") > -1) { 
                return (isNaN(d[NONWHITE]) != true) ? y(d[NONWHITE]) : barHeight;
              }else {
                return (isNaN(d[WHITE]) != true) ? y(d[WHITE]) : barHeight;
              }
            })
            .attr("height", function(d) { 
              var parentClass = d3.select(this.parentNode).attr('class');
              if (parentClass.search("All") > -1) { 
                return (isNaN(d[variable]) != true) ? barHeight - y(d[variable]) : 0;
              }else if (parentClass.search("Non") > -1){ 
                return (isNaN(d[NONWHITE]) != true) ? barHeight - y(d[NONWHITE]) : 0;
              }else {
                return (isNaN(d[WHITE]) != true) ? barHeight - y(d[WHITE]) : 0;
              }
            })

            d3.select(this).select(".data-label")
              .data([us_data])
              .attr("y", function(d) {
                var parentClass = d3.select(this.parentNode).attr('class');
                if (parentClass.search("All") > -1) {
                  return (isNaN(d[variable]) != true) ? y(d[variable]) - 16 : barHeight - 8;
                }else if (parentClass.search("Non") > -1) {
                  return (isNaN(d[NONWHITE]) != true) ? y(d[NONWHITE]) - 16 : barHeight - 8;
                }else{
                  return (isNaN(d[WHITE]) != true) ? y(d[WHITE]) - 16 : barHeight - 8;
                }
              })
            .text(function(d) { 
              var noData = (d[variable] == "n<50") ? "n/a*" : "n/a**"
              var noData_wh = (d[WHITE] == "n<50") ? "n/a*" : "n/a**"
              var noData_nw = (d[NONWHITE] == "n<50") ? "n/a*" : "n/a**"
              var parentClass = d3.select(this.parentNode).attr('class');
              if (parentClass.search("All") > -1) {
                return (isNaN(d[variable]) != true) ? formatNumber(d[variable]) : noData
              }else if (parentClass.search("Non") > -1) {
                return (isNaN(d[NONWHITE]) != true) ? formatNumber(d[NONWHITE]) : noData_nw
              }else{
                return (isNaN(d[WHITE]) != true) ? formatNumber(d[WHITE]) : noData_wh
              }
            })
        })
      if ( (zoomNational == true) && selected == null) { 
        d3.selectAll("#State, #County").style("opacity", 0)
      }else if (zoomNational_St && selected == null) {
      } else if (zoomNational == false || selected != null) { //IF MOUSE IS OVER A STATE OR COUNTY IN WHICHEVER VIEW
        var countyID = (d3.select(".counties > path.selected").node() == null ) ? "" : d3.select(".counties > path.selected").attr("id");
        var countyIDHov = (d3.select(".counties > path.hover").node() == null) ? "" : d3.select(".counties > path.hover").attr("id");
        var county = (countyID == "") ? "" : countyID.slice(2);
        var state = selected["properties"]["abbr"]
        var data =  tmp_county
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
                if (parentClass.search("All") > -1) { 
                  return (isNaN(d[variable]) != true) ? y(d[variable]) : barHeight;
                }else if (parentClass.search("Non") > -1) {
                  return (isNaN(d[NONWHITE]) != true) ? y(d[NONWHITE]) : barHeight;
                }else {
                  return (isNaN(d[WHITE]) != true) ? y(d[WHITE]) : barHeight;
                }
              })
              .attr("height", function(d) {
                var parentClass = d3.select(this.parentNode).attr('class');
                if (parentClass.search("All") > -1) {
                  return (isNaN(d[variable]) != true) ? barHeight - y(d[variable]) : 0;
                }else if (parentClass.search("Non") > -1){
                  return (isNaN(d[NONWHITE]) != true) ? barHeight - y(d[NONWHITE]) : 0;
                }else {
                  return (isNaN(d[WHITE]) != true) ? barHeight - y(d[WHITE]) : 0;
                }
              })

            d3.select(this).select(".data-label")
              .data([stateData])
              .attr("y", function(d) {
                var parentClass = d3.select(this.parentNode).attr('class');
                if (parentClass.search("All") > -1) {
                  return (isNaN(d[variable]) != true) ? y(d[variable]) - 16 : barHeight - 8;
                }else if (parentClass.search("Non") > -1) {
                  return (isNaN(d[NONWHITE]) != true) ? y(d[NONWHITE]) - 16 : barHeight - 8;
                }else{
                  return (isNaN(d[WHITE]) != true) ? y(d[WHITE]) - 16 : barHeight - 8;
                }
              })
              .text(function(d) { 
                var noData = (d[variable] == "n<50") ? "n/a*" : "n/a**"
                var noData_wh = (d[WHITE] == "n<50") ? "n/a*" : "n/a**"
                var noData_nw = (d[NONWHITE] == "n<50") ? "n/a*" : "n/a**"
                var parentClass = d3.select(this.parentNode).attr('class');
                if (parentClass.search("All") > -1) {
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
                    if (parentClass.search("All") > -1) { 
                      return (isNaN(d[variable]) != true) ? y(d[variable]) : barHeight;
                    }else if (parentClass.search("Non") > -1) {
                      return (isNaN(d[NONWHITE]) != true) ? y(d[NONWHITE]) : barHeight;
                    }else {
                      return (isNaN(d[WHITE]) != true) ? y(d[WHITE]) : barHeight;
                    }
                  })
                  .attr("height", function(d) {
                    var parentClass = d3.select(this.parentNode).attr('class');
                    if (parentClass.search("All") > -1) {
                      return (isNaN(d[variable]) != true) ? barHeight - y(d[variable]) : 0;
                    }else if (parentClass.search("Non") > -1){
                      return (isNaN(d[NONWHITE]) != true) ? barHeight - y(d[NONWHITE]) : 0;
                    }else {
                      return (isNaN(d[WHITE]) != true) ? barHeight - y(d[WHITE]) : 0;
                    }
                  })
              d3.select(this).select(".data-label")
                .data([countyData])
                .attr("y", function(d) {
                  var parentClass = d3.select(this.parentNode).attr('class');
                  if (parentClass.search("All") > -1) {
                    return (isNaN(d[variable]) != true) ? y(d[variable]) - 16 : barHeight -8;
                  }else if (parentClass.search("Non") > -1) {
                    return (isNaN(d[NONWHITE]) != true) ? y(d[NONWHITE]) - 16 : barHeight - 8;
                  }else{
                    return (isNaN(d[WHITE]) != true) ? y(d[WHITE]) - 16 : barHeight - 8;
                  }
                })
                .text(function(d) { 
                  var noData = (d[variable] == "n<50") ? "n/a*" : "n/a**"
                  var noData_wh = (d[WHITE] == "n<50") ? "n/a*" : "n/a**"
                  var noData_nw = (d[NONWHITE] == "n<50") ? "n/a*" : "n/a**"
                  var parentClass = d3.select(this.parentNode).attr('class');
                  if (parentClass.search("All") > -1) {
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
      var widgetHeight = (IS_MOBILE) ? 80 : 60;
      ($(".search-div > .ui-widget").css("height", widgetHeight))
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
        d3.selectAll("path.selectedNational").classed("selectedNational", false)
        d3.selectAll('li.tagit-choice').remove()
        $(".tagit-new").css("display", "block")
        $('.ui-widget-content.ui-autocomplete-input').focusout(function(){
            $(this).attr('placeholder','Search for a state or county');
        });
        d3.selectAll("path.selected")
          .classed("selected", false)
        d3.select("#location").html("National")
        setZoom(true,false, false)
        zoomMap(width, null, "national")
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
        var filteredData = tmp_county.filter(function(d) {
          return d.properties["county"] == county;
        })
      $("li#county").on('click', function() {
        var stateData = tmp_state.filter(function(d) {
          return d.properties["state"] == state
        })
        d3.selectAll(".counties").selectAll("path.selectedNational").classed("selectedNational", false)
        $(".tagit-new").css("display", "block")
        $(".tagit-new").css("autocomplete", "on")
        $('.ui-widget-content.ui-autocomplete-input').focusout(function(){
            $(this).attr('placeholder','');
        });
        setZoom(false,true, false)
        d3.select(this).remove()
        d3.select("#location").html( state )
        d3.selectAll(".counties > path.selected")
          .classed("selected", false)
        updateBars(SELECTED_VARIABLE, filteredData[0])
        updateTable(stateData[0])
      })
        updateBars(SELECTED_VARIABLE, filteredData[0])
    }
  }
  function updateTable(data) { 
    var data = (zoomNational == true) ? data : data["properties"];
    d3.selectAll("p.note1, p.note2").style("opacity", 0)
    d3.selectAll(".cell-data")
      .each(function(d,i) { 
        var rowVariable = [rowData[i]],
            rowVariable_nw = rowVariable + "_nw";
            rowVariable_wh = rowVariable + "_wh";
        if ((data[rowVariable]) == "n<50" || (data[rowVariable_nw]) == "n<50" || (data[rowVariable_wh]) == "n<50") { 
          d3.select("p.note1").style("opacity", 1)
        }
        if ((data[rowVariable]) == "N/A" || (data[rowVariable_nw]) == "N/A" || (data[rowVariable_wh]) == "N/A") {
          d3.select("p.note2").style("opacity", 1)
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
  function zoomMap(width, d,zoomLevel) { 
    var x, y, k;
    d3.select(".state-borders").selectAll("path")
      .classed("hide", false)
      .classed("selectedNational", false)

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
      d3.select("#location").html(d["properties"]["state"] )
      setZoom(false, true, false)
      for (var i = 0; i < tmp_state.length; i++) {
        if (tmp_state[i]["properties"]["state"] == d.properties.state){
          selectedState = tmp_state[i]
        }
      }
      // var centroid = path.centroid(selectedState); //replace with variable d to center by county 
      // x = centroid[0];
      // y = centroid[1];
      // k = 4;
      // centered = selectedState.properties.state;
      var data = (zoomLevel == "state") ? d3.select("path#" + selectedState.properties.abbr).datum() : d;
      updateTable(data)

      if (active.node() === this) return reset();
      active.classed("active", false);
      active = d3.select("path#" + d.properties.abbr).classed("active", true);
      var bounds = path.bounds(selectedState),
        dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x = (bounds[0][0] + bounds[1][0]) / 2,
        y = (bounds[0][1] + bounds[1][1]) / 2,
        scale = .9 / Math.max(dx / width, dy / height),
        translate = [width / 2 - scale * x, height / 2 - scale * y];
      g.transition()
        .duration(750)
        .attr("transform", "translate(" + translate + ")scale(" + scale + ")");

      if (zoomLevel == "county") {
          setZoom(false, true, true)
          d3.select("#location").html(d["properties"]["county"] + ", " + d["properties"]["abbr"] )
          d3.selectAll("g.counties > path").classed("selected", false)
          d3.select("path#" + d["properties"]["abbr"] + d.id)
            .classed("selected", true)
            .moveToFront()
          // updateTable(data)
      }
    }else { 
      if (IS_MOBILE == true) {
        d3.selectAll(".hover").classed("hover", false)
      }
      //ZOOM OUT TO NATIONAL VIEW
      if (zoomNational_St == true) {
        updateBars(SELECTED_VARIABLE, null)

      }else {
        setZoom(true, false, false)
        updateTable(us_data)
        updateBars(SELECTED_VARIABLE, d)
      }
      $('.zoomBtn').css("display", "none")
      $('.tagit-new > input').attr('placeholder', '')
      $(".state-borders").css("pointer-events", "all")
      $(".counties").css("pointer-events", "none")
      x = width / 1.4;
      y = height / 1.5;
      k = .7;
      centered = null;
      g.selectAll("path")
          .classed("active", centered && function(d) {return d === centered; });
      var translateHeight = height*.05,
          mapScale = (IS_MOBILE) ? width/930 : width/1010;

      g.transition()
          .duration(750)
          .attr("transform", "translate(" + (-10) + "," + (translateHeight) + ")scale(" + mapScale + ")")
          // .style("stroke-width", 1.5 / k + "px");
      d3.selectAll("path.selected").classed("selectedNational", true)
    }
      // var selectedPlace = (d3.selectAll(".counties").selectAll("path.selected").size() > 0) ? d3.selectAll(".counties").select("path.selected").datum() : d3.selectAll(".state-borders").select("path.selected").datum() ;
      // var d2 = (selectedPlace==null) ? null : selectedPlace;

  }

  $(window).resize(function() { 
    setScreenState (d3.select("#isMobile").style("display") == "block", d3.select("#isPhone").style("display") == "block", d3.select("#isPhoneSm").style("display") == "block" )
    initialWidth = (IS_PHONE) ? $('body').width() : $("body").width() - $(".td-table").width() 
    barSvgHeight = (IS_MOBILE) ? 185 : 130
    barSvgHeight_ph = (IS_PHONESM) ? 200 : 173
    barHeight = (IS_MOBILE) ? 90 : 65;
    barWidth = (IS_MOBILE) ? 42 : 50;
    setHeight = tdMap*.7;
    var x = d3.scaleBand()
      .rangeRound([0, barWidth])
    var xAxis = d3.axisBottom()
        .scale(x)
    //    margin = (IS_PHONE) ? {top: 10, right: 30, bottom: 10, left: 30} : {top: 10, right: 31, bottom: 10, left: 55}
    setWidth(initialWidth, IS_MOBILE, IS_PHONE)
    var mobilePadding = (IS_MOBILE) ? 0 : 15;
    width = tdMap - mobilePadding  //- margin.right-margin.left,
    height = (IS_PHONE) ? (width) - margin.top-margin.bottom :  setHeight//(width*.57) - margin.top-margin.bottom,       
    if (IS_PHONE) {
      var barSvgHeight_ph = (IS_PHONESM) ? 200 : 173;
      var barWidth_ph = (IS_PHONESM) ? width : width*.85;
      var x_ph = d3.scaleLinear().range([0, barWidth_ph]);
      x_ph.domain([0, d3.max(county_data, function(d) {
        if (isNaN(d[NONWHITE_ph]) == true && isNaN(d[WHITE_ph]) == true){
          return d[SELECTED_VARIABLE_ph]
        }else if (isNaN(d[NONWHITE_ph]) == true && isNaN(d[WHITE_ph]) == false) {
          return Math.max(d[WHITE_ph], d[SELECTED_VARIABLE_ph])
        }else if (isNaN(d[WHITE_ph] == true && isNaN(d[NONWHITE_ph])) == false) {
          return Math.max(d[NONWHITE_ph], d[SELECTED_VARIABLE_ph])
        }else {
          return Math.max(d[WHITE_ph], d[NONWHITE_ph], d[SELECTED_VARIABLE_ph])
        }
      })])
      d3.selectAll(".bar-group-ph").selectAll(".category-ph")
        .each(function(d,i) {
          d3.select(this)
            .attr("transform", function() {
              return (IS_PHONESM) ? "translate(" + 0 + "," + (52*i) + ")" : "translate(" + 0 + "," + (40*i) + ")";
            })
        })
      d3.selectAll("g.bar-group-ph")
        .each(function(d,i) {
          d3.select(this)
            .attr("transform", function() {
              return (IS_PHONESM) ? "translate(" + 0 + "," + (20) + ")" : "translate(" + 0 + "," + 0 + ")";
            })
        })

      d3.selectAll(".label").selectAll(".category-labels-ph")
        .each(function(d,i) {
          d3.select(this)
          .attr("transform", function() {
            return (IS_PHONESM) ? "translate(" + 0 + "," + (52*i + 57) + ")" : "translate(" + 74 + "," + (40*i + 25) + ")";

          })
        })
      d3.selectAll(".label")
        .attr("width", width*.15)
        .attr("height", 163)
      d3.selectAll(".bar_ph" ).select("svg")
        .attr("width", barWidth_ph)
        .attr("height", barSvgHeight_ph)
      d3.selectAll(".bar-ph")
        .attr("width", function(d) {  
          var parentClass = d3.select(this.parentNode).attr('class');
          if (parentClass.search("All") > -1) {
            return (isNaN(d[SELECTED_VARIABLE_ph]) != true) ? x_ph(d[SELECTED_VARIABLE_ph]) : 0
          }else if (parentClass.search("Non") > -1) {
            return (isNaN(d[NONWHITE_ph]) != true) ?  x_ph(d[NONWHITE_ph]) : 0
          }else{
            return (isNaN(d[WHITE_ph]) != true) ?  x_ph(d[WHITE_ph]) : 0
          }
        })
      d3.selectAll(".data-label-ph")
        .attr("x", function(d) { 
          var parentClass = $(this).closest(".rect-g").attr("class")
          if (parentClass.search("All") > -1) {// console.log((isNaN(d[SELECTED_VARIABLE]) != true) ? x_ph(d[SELECTED_VARIABLE]) + 5 : 5)
            return (isNaN(d[SELECTED_VARIABLE_ph]) != true) ? x_ph(d[SELECTED_VARIABLE_ph]) + 5 : 0
          }else if (parentClass.search("Non") > -1) {
            return (isNaN(d[NONWHITE_ph]) != true) ? x_ph(d[NONWHITE_ph]) + 5 : 0
          }else{
            return (isNaN(d[WHITE_ph]) != true) ? x_ph(d[WHITE_ph]) + 5 : 0
          }
        })

    }else { 
      var widgetHeight = (IS_MOBILE) ? 80 : 60;
      ($(".search-div > .ui-widget").css("height", widgetHeight))
      if (d3.selectAll("path.selected").size() > 0){
        setZoom(false, false, false, true)
        zoomMap(width, null, "national")
      }else {
        setZoom(true, false, false)
        // zoomMap(null, "national")
      }
      d3.select(".state-borders").selectAll("path")
        .classed("hide", false)
      d3.selectAll("path.selected")
        .classed("selectedNational", true)
      //UPDATE MOBILE LEGEND
      var legendPh = d3.select("#legend-div").select("svg")
        .attr("width", width*.95)
      var keyWidthPh =   width/8;
      for (i=0; i<=6; i++){
        if(i  < 5){  
          legendPh.select(".rect" + i)
            .attr("width",keyWidthPh)
            .attr("x",keyWidthPh*i + 50)
          d3.select(".legend-labels-ph" + i)
            .attr("x",keyWidthPh*i + 55)
         }
        if(i==6){  
          legendPh.select(".rect" + i)
            .attr("width",keyWidthPh)
            .attr("x",keyWidthPh*i + 17)
          d3.select(".legend-labels-ph" + i)
            .attr("x",keyWidthPh*i + 45)

         }
         if (i == 5) { 
          d3.select(".legend-labels-ph" + i)
            .attr("x",keyWidthPh*i + 55 )
          }
        }
      //UPDATE BAR CHARTS
      var chartPadding = (IS_MOBILE) ? 15 : 0;
      d3.select("#bar-chart").select("svg")
        .attr('width', width - chartPadding)
        .attr("height", barSvgHeight)
      d3.selectAll(".bar-group")
        .each(function(d,i) {
          d3.select(this)
          .attr("transform", function(d,i) {
            return "translate(" + ( (width/3.1 + 5) * i) + "," + (20) + ")";
          })
        })
      d3.selectAll(".category")
        .each(function(d,i) {
          d3.select(this)
          .attr("transform", function(d,i) {
            return (IS_MOBILE) ? "translate(" + ((barWidth+2) * i ) + "," + 10 + ")" : "translate(" + (60 * i ) + "," + 10 + ")"
          })
        })
      d3.selectAll(".g-text > text")
      .attr("y", barHeight + 10)
      d3.selectAll(".x.axis")
      .attr("transform", function(d,i) {
        return "translate(" + 0 +"," + barHeight+ ")"
      })
      .call(xAxis)
      rectG.selectAll(".bar")
        .attr("width", x.bandwidth())
        .attr("y", function(d) { 
          var parentClass = d3.select(this.parentNode).attr('class');
          if (parentClass.search("All") > -1) { 
            return (isNaN(d[SELECTED_VARIABLE]) != true) ? y(d[SELECTED_VARIABLE]) : barHeight;
          }else if (parentClass.search("Non") > -1) { 
            return (isNaN(d[NONWHITE]) != true) ? y(d[NONWHITE]) : barHeight;
          }else {
            return (isNaN(d[WHITE]) != true) ? y(d[WHITE]) : barHeight;
          }
        })
        .attr("height", function(d) { 
          var parentClass = d3.select(this.parentNode).attr('class');
          if (parentClass.search("All") > -1) { 
            return (isNaN(d[SELECTED_VARIABLE]) != true) ? barHeight - y(d[SELECTED_VARIABLE]) : 0;
          }else if (parentClass.search("Non") > -1){ 
            return (isNaN(d[NONWHITE]) != true) ? barHeight - y(d[NONWHITE]) : 0;
          }else {
            return (isNaN(d[WHITE]) != true) ? barHeight - y(d[WHITE]) : 0;
          }
        })
      d3.selectAll(".bar-text")
        .attr("y", function(d) {
          var parentClass = d3.select(this.parentNode).attr('class');
          if (parentClass.search("All") > -1) {
            return (isNaN(d[SELECTED_VARIABLE]) != true) ? y(d[SELECTED_VARIABLE]) - 16 : barHeight -8;
          }else if (parentClass.search("Non") > -1) {
            return (isNaN(d[NONWHITE]) != true) ? y(d[NONWHITE]) - 16 : barHeight - 8;
          }else{
            return (isNaN(d[WHITE]) != true) ? y(d[WHITE]) - 16 : barHeight - 8;
          }
        })
      d3.selectAll(".data-label")
        .attr("y", function(d) {
          var parentClass = d3.select(this.parentNode).attr('class');
          if (parentClass.search("All") > -1) {
            return (isNaN(d[SELECTED_VARIABLE]) != true) ? y(d[SELECTED_VARIABLE]) - 16 : barHeight -8;
          }else if (parentClass.search("Non") > -1) {
            return (isNaN(d[NONWHITE]) != true) ? y(d[NONWHITE]) - 16 : barHeight - 8;
          }else{
            return (isNaN(d[WHITE]) != true) ? y(d[WHITE]) - 16 : barHeight - 8;
          }
        })
      $("table").height($("table").width()*0.8);
      // var chartPadding = (IS_MOBILE) ? 15 : 0;
      d3.select("#map").select('svg')
        .attr('width', width)
        .attr('height', height)
      svg.select("rect")
        .attr('width', width)
        .attr('height', height)
      var translateHeight = (IS_MOBILE) ? height*.05 : height*.1,
          mapScale = (IS_MOBILE) ? width/930 : width/1010;
      svg.select(".map-g")
        .attr("transform", "translate(" + (-10) + "," + (translateHeight) + ")scale(" + mapScale + ")")

      //  .attr("transform", "scale(" + width/1060 + ")");
      d3.selectAll(".bar-group")
        .each(function(d,i) {
          d3.select(this)
            .attr("transform", function() { 
              return "translate(" + ( (width/3.1 + 5) * i) + "," + (20) + ")";
            })
        })
      barG.selectAll('.category')
        .each(function(d,i) {
          d3.select(this)
            .attr("transform", function() {
              return (IS_MOBILE) ? "translate(" + ((barWidth + 2) * i ) + "," + 10 + ")" : "translate(" + (60 * i ) + "," + 10 + ")"
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
        .attr('transform', 'translate(' + (width- 55) + ',' + 20 + ')')

      d3.select(".rect-div")
        .attr("width", function() {
          return (IS_MOBILE) ? 73: 65
        })
        .attr('transform', 'translate(' + (width- 64) + ',' + (-1) + ')')


      }
 
  })


};





