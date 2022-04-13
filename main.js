require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/widgets/Legend",
  "esri/layers/GeoJSONLayer",
  "esri/widgets/Histogram",
  "esri/widgets/Home",
  "esri/widgets/BasemapGallery",
], (Map, MapView, FeatureLayer, Legend, GeoJSONLayer,Histogram,Home,BasemapGallery) => {
  const defaultSym = {
    type: "simple-fill", 
    outline: {
      color: [128, 128, 128, 0.2],
      width: "0.5px",
    },
  };
  const nationalUrl =
    "https://services3.arcgis.com/1FS0hEOLnjHnov75/arcgis/rest/services/WHOThematicMap_gdb/FeatureServer/0";
  const nationalViewUrl =
    "https://services3.arcgis.com/1FS0hEOLnjHnov75/arcgis/rest/services/WHOThematicMap_gdb/FeatureServer/1";

  const nationalLevel = new FeatureLayer({
    url: nationalUrl,
  });
  const nationalLevelView = new FeatureLayer({
    url: nationalViewUrl,
  });

  function getColor(value, min, max, variable) {
    switch (variable) {
      case "ConfirmedCases":
        var startColor = "#fbc09b";
        var endColor = "#c65a18";
        break;
      case "CFR":
        var startColor = "#f07062";
        var endColor = "#a8281e";
        break;
      case "sampleTested":
        var startColor = "#FFFF07";
        var endColor = "#a4a400";
        break;
      case "RecoveryRate":
        var startColor = "#5EE55E";
        var endColor = "#1FBC1F";
        break;
    }

    const scale = chroma.scale([startColor, endColor]).domain([min, max]);
    return scale(value).hex();
  }
  function StartLoading() {
    document.getElementById("basemapGallery").style.display = "none";
    document.getElementById("viewDiv").style.display = "none";
    document.getElementById("legendIcon").style.display = "none";
    document.getElementById("filteringIcon").style.display = "none";
    document.getElementById("loadingBox").style.display = "flex";
  }
  function EndLoading() {
    document.getElementById("loadingBox").style.display = "none";
    document.getElementById("filteringIcon").style.display = "block";
    document.getElementById("legendIcon").style.display = "block";
    document.getElementById("basemapGallery").style.display = "block";
    document.getElementById("filters").style.display = "block";
    document.getElementById("viewDiv").style.display = "flex";
  }
  function GetPopUpTemplate(variable) {
    var label = "";
    switch (variable) {
      case "ConfirmedCases":
        label = "Total reported cases per 100,000 population";
        break;
      case "CFR":
        label = "Case fatality ratio %";
        break;
      case "sampleTested":
        label = "Total tests per 1000,000 population";
        break;
      case "RecoveryRate":
        label = "Recovery rate %";
        break;
    }
    const template = {
      // autocasts as new PopupTemplate()
      title: "{Name}",
      content: [
        {
          type: "fields",
          fieldInfos: [
            {
              fieldName: variable,
              label: label,
            },
            {
              fieldName: "Population",
              label: "Population",
            },
          ],
        },
      ],
    };
    return template;
  }
  function GetLegendTitle(variable) {
    switch (variable) {
      case "ConfirmedCases":
        return "Reported cases per 100,000 population by country";
      case "CFR":
        return "Case fatality ratio by country %";
      case "sampleTested":
        return "Total tests per 1000,000 population by country %";
      case "RecoveryRate":
        return "The recovery rate by country %";
    }
  }
  function FillCountriesMenu() {
    var countrySelector = document.getElementById("countriesList");
    nationalLevel.queryFeatures().then(function (results) {
      var countries = results.features.map(f=>f.attributes.Name);
      countries.unshift("All")
      countries.forEach((countryName) => {
        var element = document.createElement("option");
        element.textContent = countryName;
        element.value = countryName;
        countrySelector.appendChild(element);
      });
    });
  }
  function FillDateMenu() {
    var periodType = document.getElementById("PeriodTypeList").value;
    var periodDataSelector = document.getElementById("PeriodDateList");
    const query = {
      where: "PeriodTypeId = '" + periodType + "'",
      returnGeometry: false,
      outFields: ["NationalLevelName,PeriodData"],
    };
    nationalLevelView.queryFeatures(query).then(function (results) {
      var filtered = results.features
        .filter((r) => r.attributes.NationalLevelName == "United Arab Emirates")
        .map((f) => f.attributes.PeriodData)
        .reverse();
        filtered.unshift("Total")
      filtered.forEach((f) => {
        var date = f;
        var element = document.createElement("option");
        element.textContent = date;
        element.value = date;
        periodDataSelector.appendChild(element);
      });
    });
  }

  StartLoading();
  FillCountriesMenu();
  FillDateMenu();
  const map = new Map({
    basemap: "gray-vector",
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [25, 20],
    zoom: 3,
  });
  
  var startingVariable = "ConfirmedCases";
  function GetRenderer(variable, min, max) {
    var legendTitle = GetLegendTitle(variable);

    const renderer = {
      type: "simple", 
      symbol: defaultSym,
      label: "EMRO Countries",
      visualVariables: [
        {
          type: "color",
          field: variable,
          //normalizationField: "Population",
          legendOptions: {
            title: legendTitle,
          },
          stops: [
            {
              value: min,
              color: getColor(0, 0, 1, variable),
              label: min,
            },
            {
              value: (min + max) * 0.5,
              color: getColor(0.5, 0, 1, variable),
              label: (min + max) * 0.5,
            },
            {
              value: max,
              color: getColor(1, 0, 1, variable),
              label: max,
            },
          ],
        },
      ],
    };
    return renderer;
  }

  function RenderFeatures(featureLayer, variable) {
    require(["esri/smartMapping/statistics/summaryStatistics"], (
      summaryStatistics
    ) => {
      console.log(featureLayer);
      summaryStatistics({
        layer: featureLayer,
        field: variable,
      }).then(function (stats) {
       
        const nationalLevelRenderLayer = new FeatureLayer({
          url: nationalUrl,
          renderer: GetRenderer(variable, stats.min, stats.max),
          title: "Emro Countries",
          popupTemplate: GetPopUpTemplate(variable),
        });
        map.add(nationalLevelRenderLayer);
      });
    });
  }

  function ChangeVariable() {
    StartLoading();
    var variable = this.value;
    //Check if specific date selected
    let date = document.getElementById("PeriodDateList").value;
    if(date =="Total")
    {
      map.removeAll();
      RenderFeatures(nationalLevel, variable);
      setTimeout(EndLoading, 1000);
    }else{
      ChangeDate()
    }
  }
  document.getElementById("variablesList").onchange = ChangeVariable;

  function ChangeDateType() {
    var periodDataSelector = document.getElementById("PeriodDateList");
    while (periodDataSelector.options.length > 0) {
      periodDataSelector.remove(0);
    }
    FillDateMenu();
  }
  document.getElementById("PeriodTypeList").onchange = ChangeDateType;

  function ChangeDate() {
    dataHolder = [];
    var periodDataValue = document.getElementById("PeriodDateList").value;
    var _query = {
      where: "PeriodData = '" + periodDataValue + "'",
      returnGeometry: false,
      outFields: ["*"],
    };

    const geojson = {
      type: "FeatureCollection",
      features: [],
    };

    nationalLevelView.queryFeatures(_query).then(function (filterdResult) {
      filterdResult.features.forEach((f) => dataHolder.push(f));


      nationalLevel.queryFeatures().then(function (results) {
        dataHolder.forEach( record =>{
          let feature = results.features.filter(res => {res.attributes.Code == record.attributes.NationalLevelCode })[0]
          let codes = record.attributes.NationalLevelCode
         
          geojson.features.push({
            type: "Feature",
            // geometry: feature.geometry,
            properties: {
              // Name: feature.attributes.Name,
              ConfirmedCases: record.attributes.ConfirmedCases,
              OBJECTID: record.attributes.OBJECTID,
              CFR: record.attributes.CFR,
              // Recovered: record.attributes.RecoveredCases,
              // Death: record.attributes.DeathCases,
            }
          });
        });

        const blob = new Blob([JSON.stringify(geojson)], {type: "application/json" });
        const url = URL.createObjectURL(blob);
        const layer = new GeoJSONLayer({url})
  
        var variable = document.getElementById("variablesList").value;
        StartLoading();
        map.removeAll();
        RenderFeatures(layer, variable);
        setTimeout(EndLoading, 1000);
      });
    });
  }
  document.getElementById("PeriodDateList").onchange = ChangeDate;

  function ChangeDateType() {
    var periodDataSelector = document.getElementById("PeriodDateList");
    while (periodDataSelector.options.length > 0) {
      periodDataSelector.remove(0);
    }
    if(this.value == "0"){ //Total
      var variable = document.getElementById("variablesList").value;
      StartLoading();
      map.removeAll();
      RenderFeatures(nationalLevel, variable);
      setTimeout(EndLoading, 1000);
    }
    // else
    // {
    //   FillDateMenu();
    // }
    FillDateMenu();
  }
  document.getElementById("PeriodTypeList").onchange = ChangeDateType;

  function ZoomToCountry() {
    if (this.value != "All") {
      var query = {
        where: "Name = '" + this.value + "'",
        returnGeometry: true,
        outFields: ["*"],
      };
      nationalLevel.queryFeatures(query).then(function (results) {
        let caller = results.features[0];
        view.goTo(caller.geometry, { duration: 1000 });
      });
    } else {
      view.goTo(
        {
          center: [30, 20],
          zoom: 3,
        },
        { duration: 1000 }
      );
    }
  }
  document.getElementById("countriesList").onchange = ZoomToCountry;

  //Starting point
  RenderFeatures(nationalLevel, startingVariable);
  setTimeout(EndLoading, 1000);

  view.ui.move("zoom", "top-right");
  let homeWidget = new Home({ view: view});
  view.ui.add(homeWidget, "top-right");
  view.ui.add('basemapGallery', "top-right");
  // view.ui.add("filteringIcon", "top-left");
  view.ui.add("legendIcon", "bottom-left");
  view.ui.add("filteringIcon", "top-left");
  view.ui.add("filters", "top-left");

  const basemapGallery = new BasemapGallery({
    view: view,
    container: document.createElement("div")
  });
  const legend = new Legend({
    view: view,
    expanded: true,
    expandIconClass: "esri-icon-legend",
    expandTooltip: "Expand Legend"
  });
  view.ui.add(legend, "bottom-left");

  view.ui.add(basemapGallery, { position: "top-right" });
  basemapGallery.visible = false;

  document.getElementById("basemapGallery").addEventListener("click",() => {
    basemapGallery.visible = !basemapGallery.visible
  });
  document.getElementById("legendIcon").addEventListener("click",() => {
    legend.visible = !legend.visible
  });
  document.getElementById("filteringIcon").addEventListener("click",() => {
    let filters = document.getElementById("filters");
    filters.style.display  = (filters.style.display === 'block') ? "none" :"block";
  });

  // view.whenLayerView(nationalLevel).then((layerView) => {
  //   let highlight;
  //   // listen for the pointer-move event on the View
  //   view.on("pointer-move", (event) => {
  //     // Perform a hitTest on the View
  //     view.hitTest(event).then((event) => {
  //       // Make sure graphic has a popupTemplate
  //       const results = event.results.filter((result) => {
  //         return result.graphic.layer.popupTemplate;
  //       });
  //       const result = results[0];
  //       highlight && highlight.remove();
  //       // Update the graphic of the Feature widget
  //       // on pointer-move with the result
  //       if (result) {
  //         feature.graphic = result.graphic;
  //         highlight = layerView.highlight(result.graphic);
  //       } else {
  //         feature.graphic = graphic;
  //       }
  //     });
  //   });
  // });
});
