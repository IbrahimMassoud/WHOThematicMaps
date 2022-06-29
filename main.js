require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/widgets/Legend",
    "esri/layers/GeoJSONLayer",
    "esri/widgets/Home",
    "esri/smartMapping/renderers/color",
    "esri/smartMapping/symbology/color",
    "esri/smartMapping/symbology/support/colorRamps",
    "esri/layers/GraphicsLayer",
    "esri/smartMapping/statistics/summaryStatistics",
    "esri/widgets/Expand",
], (
    Map,
    MapView,
    FeatureLayer,
    Legend,
    GeoJSONLayer,
    Home,
    colorRendererCreator,
    colorSymbology,
    colorRamps,
    Graphic,
    SummaryStatistics,
    Expand,
) => {
   
    const nationalUrl =
        //Prosylab
        "https://services3.arcgis.com/1FS0hEOLnjHnov75/arcgis/rest/services/WHO_EMRO_GD_20220417_ThematicMap/FeatureServer/0";
    //WHO, Not public till now
    //"https://services.arcgis.com/5T5nSi527N4F7luB/arcgis/rest/services/WHO_EMRO_GD_gdb/FeatureServer/0"; ==> service
    //"https://who.maps.arcgis.com/home/item.html?id=4282c9322e8144c08f1812ece8cc7cdc&sublayer=0" ==> Url at AGOL

    const nationalViewUrl =
        //Prosylab
        "https://services3.arcgis.com/1FS0hEOLnjHnov75/arcgis/rest/services/WHO_EMRO_GD_20220417_ThematicMap/FeatureServer/4";
    //WHO, Not public till now
    //"https://services.arcgis.com/5T5nSi527N4F7luB/arcgis/rest/services/WHO_EMRO_GD_gdb/FeatureServer/4"; ==> service
    //"https://who.maps.arcgis.com/home/item.html?id=4282c9322e8144c08f1812ece8cc7cdc&sublayer=4" ==> Url at AGOL

    const disputedBoundariesUrl =
        //Prosylab
        "https://services3.arcgis.com/1FS0hEOLnjHnov75/arcgis/rest/services/EMRO_Disputed_boundaries_FGDB/FeatureServer"
    //WHO, Not public till now
    //"https://services.arcgis.com/5T5nSi527N4F7luB/arcgis/rest/services/EMRO_Disputed_boundaries/FeatureServer"; ==> service
    //"https://who.maps.arcgis.com/home/item.html?id=1fccaeb33e29418c987590b8e62943cb#overview" ==> Url at AGOL

    const classificationMethod = "natural-breaks";
    const numClasses = 5;

    const backGroundLayer = new FeatureLayer({
        url: nationalUrl,
    });
    const foreGroundLayer = new FeatureLayer({
        url: nationalUrl,
    });
    const nationalLevelView = new FeatureLayer({
        url: nationalViewUrl,
    });
    const disputedBoundaries = new FeatureLayer({
        url: disputedBoundariesUrl,
        title: "Disputed Boundaries",
    });

    const map = new Map({
        basemap: "dark-gray-vector",
    });

    const view = new MapView({
        container: "viewDiv",
        map: map,
        center: [20, 20],
        zoom: 3,
    });

    const defaultScheme = colorSymbology.getSchemeByName({
        basemap: map.basemap,
        geometryType: "polygon",
        theme: "above-and-below",
        name: "Esri Green and Blue 4",
    });
    const defaultSymbol = {
        type: "simple-marker",
        outline: {
            width: 1
        }
    };

    function GetColorRampName(firstIndicator) {
        switch (firstIndicator) {
            case "AttackRate":
                return "Esri Pumpkin Pie";
            case "CFR":
                return "Red 8";
            case "SampleTested":
                return "Purple 9";
            case "MortalityRate":
                return "Esri Red 1";
            case "RecoveryRate":
                return "Esri Green 2";
        }
    }
    function GetColor(secondIndicator) {
        switch (secondIndicator) {
            case "AttackRate":
                return [251, 182, 100, 0.75];
            case "CFR":
                return [194, 61, 51, 0.75];
            case "SampleTested":
                return [133, 49, 193, 0.75];
            case "MortalityRate":
                return [216, 48, 32, 0.75];
            case "RecoveryRate":
                return [97, 198, 111, 0.75];
        }
    }
    function AddLayersToMap(...layers) {
        layers.forEach(layer => map.add(layer))
    }
    function CreatePolygonRenderer(featureLayer, firstIndicator) {
        featureLayer.title = GetLabel(firstIndicator) //"0-Map legend";
        var colorRampName = GetColorRampName(firstIndicator);
        defaultScheme.colorsForClassBreaks =
            colorRamps.byName(colorRampName).colorsForClassBreaks;
        const colorScheme = colorSymbology.flipColors(defaultScheme);
        const params = {
            layer: featureLayer,
            view: view,
            field: firstIndicator,
            classificationMethod: classificationMethod,
            numClasses: numClasses,
            colorScheme: colorScheme,
            legendOptions: {
                title: " ",
            },
        };

        colorRendererCreator
            .createClassBreaksRenderer(params)
            .then((rendererResponse) => {
                featureLayer.renderer = rendererResponse.renderer;
                featureLayer.renderer.defaultSymbol = null
                featureLayer.popupTemplate = GetPopUpTemplate(firstIndicator);

                // return rendererResponse.renderer;
            });
        // .then(function (returnedRendered) {
        //   const backGroundLayerRenderer = new FeatureLayer({
        //     url: nationalUrl,
        //     renderer: returnedRendered,
        //     title: "Emro Countries",
        //     popupTemplate: GetPopUpTemplate(firstIndicator),
        //   });
        //   map.add(backGroundLayerRenderer);
        // });
    }
    function StartLoading() {
        document.getElementById("viewDiv").style.display = "none";
        // document.getElementById("filteringIcon").style.display = "none";
        document.getElementById("loadingBox").style.display = "flex";
    }
    function EndLoading() {
        document.getElementById("loadingBox").style.display = "none";
        // document.getElementById("filteringIcon").style.display = "flex";
        document.getElementById("filters").style.display = "block";
        document.getElementById("Indicators").style.display = "block";
        document.getElementById("viewDiv").style.display = "flex";
    }
    function GetPopUpTemplate(indicator) {
        var label = GetLabel(indicator);
        const template = {
            title: "{Name}",
            content: [
                {
                    type: "fields",
                    fieldInfos: [
                        {
                            fieldName: indicator,
                            label: label,
                            format: {
                                digitSeparator: true,
                                // places: 0,
                            },
                        },
                        {
                            fieldName: "Population",
                            label: "Population",
                            format: {
                                digitSeparator: true,
                                places: 0,
                            },
                        },
                    ],
                },
            ],
        };
        return template;
    }
    function GetLabel(indicator) {
        switch (indicator) {
            case "AttackRate":
                return "Confirmed cases per 100,000 population";
            case "CFR":
                return "Case fatality ratio %";
            case "SampleTested":
                return "Tests per 1000,000 population";
            case "RecoveryRate":
                return "Recovery rate %";
            case "MortalityRate":
                return "Deaths per 100,000 population";
        }
    }
    function FillCountriesMenu() {
        var countrySelector = document.getElementById("countriesList");
        backGroundLayer.queryFeatures().then(function (results) {
            var countries = results.features.map((f) => f.attributes.Name);
            countries.unshift("All");
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
            filtered.unshift("Total");
            filtered.forEach((f) => {
                var date = f;
                var element = document.createElement("option");
                element.textContent = date;
                element.value = date;
                periodDataSelector.appendChild(element);
            });
        });
    }
    function SetIconsColor() {
        var firstIndicator = document.getElementById("1stIndicatorsList").value;
        var secondIndicator = document.getElementById("2ndIndicatorsList").value;

        var polIcon = document.getElementById("PolIcon");
        var pointIcon = document.getElementById("PointIcon");

        polIcon.style.color = `rgba(${GetColor(firstIndicator).join(',')})`
        pointIcon.style.color = `rgba(${GetColor(secondIndicator).join(',')})`
    }
    function ChangePolygonLayerIndicator() {
        StartLoading();
        var firstIndicator = this.value;
        //Check if specific date selected
        let date = document.getElementById("PeriodDateList").value;
        if (date == "Total") {
            map.removeAll();
            CreatePolygonRenderer(backGroundLayer, firstIndicator);
            AddLayersToMap(backGroundLayer, foreGroundLayer, disputedBoundaries)
            SetIconsColor()
            setTimeout(EndLoading, 2000);
        } else {
            FilterRecordsByDate();
        }
    }
    document.getElementById("1stIndicatorsList").onchange = ChangePolygonLayerIndicator;

    function ChangeDateType() {
        var periodDataSelector = document.getElementById("PeriodDateList");
        while (periodDataSelector.options.length > 0) {
            periodDataSelector.remove(0);
        }
        FillDateMenu();
    }
    document.getElementById("PeriodTypeList").onchange = ChangeDateType;

    function FilterRecordsByDate() {
        StartLoading();
        var periodData = document.getElementById("PeriodDateList").value;
        var periodTypeId = document.getElementById("PeriodTypeList").value;
        var firstIndicator = document.getElementById("1stIndicatorsList").value;
        var secondIndicator = document.getElementById("2ndIndicatorsList").value;
        SetIconsColor()

        if (periodData == "Total") {
            map.removeAll();
            CreatePolygonRenderer(backGroundLayer, firstIndicator);
            CreateDotRenderer(foreGroundLayer, secondIndicator)
            AddLayersToMap(backGroundLayer, foreGroundLayer, disputedBoundaries)
            setTimeout(EndLoading, 1000);
        } else {
            let dataHolder = [];
            let featuresToBeAdded = [];

            let _query = {
                where: "PeriodData = '" + periodData + "'" + " AND  PeriodTypeId = '" + periodTypeId + "'",
                returnGeometry: false,
                outFields: ["*"],
            };

            let fields = [{
                name: "ObjectID_1",
                alias: "ObjectID",
                type: "oid",
            },
            {
                name: "AttackRate",
                alias: "AttackRate",
                type: "double",
            },
            {
                name: "CFR",
                alias: "CFR",
                type: "double",
            },
            {
                name: "RecoveryRate",
                alias: "RecoveryRate",
                type: "double",
            },
            {
                name: "SampleTested",
                alias: "SampleTested",
                type: "double",
            },
            {
                name: "Population",
                alias: "Population",
                type: "integer",
            },
            {
                name: "Name",
                alias: "Name",
                type: "string",
            },
            {
                name: "MortalityRate",
                alias: "MortalityRate",
                type: "double",
            }]
          
            nationalLevelView.queryFeatures(_query).then(function (filterdResult) {
                filterdResult.features.forEach((f) => dataHolder.push(f));

                backGroundLayer.queryFeatures().then(function (results) {
                    dataHolder.forEach((record) => {
                        let feature;
                        for (let i = 0; i < results.features.length; i++) {
                            if (
                                results.features[i].attributes.Code ==
                                record.attributes.NationalLevelCode
                            ) {
                                feature = results.features[i];
                                break;
                            }
                        }
                        // feature = results.features.filter(res =>  res.attributes.Code == record.attributes.NationalLevelCode )
                        featuresToBeAdded.push(
                            new Graphic({
                                geometry: feature.geometry,
                                attributes: {
                                    Name: feature.attributes.Name,
                                    Population: feature.attributes.Population,
                                    AttackRate: record.attributes.AttackRate,
                                    CFR: record.attributes.CFR,
                                    RecoveryRate: record.attributes.RecoveryRate,
                                    SampleTested: record.attributes.SampleTested,
                                    MortalityRate: record.attributes.MortalityRate,
                                },
                            })
                        );
                    });

                    var foreGroundNewlyr = new FeatureLayer({
                        source: featuresToBeAdded,
                        objectIdField: "ObjectID_1",
                        fields:  fields,
                        
                      });
                      var backGroundNewlyr = new FeatureLayer({
                        source: featuresToBeAdded,
                        objectIdField: "ObjectID_1",
                        fields:  fields,
                        
                      });

                    map.removeAll()
                    CreatePolygonRenderer(backGroundNewlyr, firstIndicator);
                    CreateDotRenderer(foreGroundNewlyr, secondIndicator);
                    AddLayersToMap(backGroundNewlyr,foreGroundLayer,disputedBoundaries)
                    setTimeout(EndLoading, 2000);
                });
            });
        }
    }
    document.getElementById("PeriodDateList").onchange = FilterRecordsByDate;

    function ChangeDateType() {
        var periodDataSelector = document.getElementById("PeriodDateList");
        while (periodDataSelector.options.length > 0) {
            periodDataSelector.remove(0);
        }
        if (this.value == "0") {
            //Total
            var firstIndicator = document.getElementById("1stIndicatorsList").value;
            StartLoading();
            map.removeAll();
            CreatePolygonRenderer(backGroundLayer, firstIndicator);
            AddLayersToMap(backGroundLayer, foreGroundLayer, disputedBoundaries)

            setTimeout(EndLoading, 1000);
        }
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
            backGroundLayer.queryFeatures(query).then(function (results) {
                let caller = results.features[0];
                view.goTo(caller.geometry, { duration: 1500 });
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

    function CreateDotRenderer(featureLayer, indicator) {

        defaultSymbol.color = GetColor(indicator)
        defaultSymbol.outline.color = GetColor(indicator)
        SummaryStatistics({
            layer: featureLayer,
            field: indicator,
        }).then(function (statistics) {
            const foreGroundRenderer = {
                type: "simple",
                symbol: defaultSymbol,
                visualVariables: [
                    {
                        type: "size",
                        field: indicator,
                        minDataValue: statistics.min,
                        maxDataValue: statistics.max,
                        minSize: 10,
                        maxSize: 35,
                        legendOptions: {
                            title: " ",
                        }
                    },
                ],
            };

            featureLayer.renderer = foreGroundRenderer;
            featureLayer.title = GetLabel(indicator);
            featureLayer.popupTemplate = GetPopUpTemplate(indicator);
            SetIconsColor()
        });
    }
    function ChangeDotLayerIndicator() {
        StartLoading();
        var indicator = this.value;
        //Check if specific date selected
        let date = document.getElementById("PeriodDateList").value;
        if (date == "Total") {
            map.removeAll();
            CreateDotRenderer(foreGroundLayer, indicator);
            AddLayersToMap(backGroundLayer, foreGroundLayer, disputedBoundaries)
            setTimeout(EndLoading, 2000);
        } else {
            FilterRecordsByDate();
        }
    }
    document.getElementById("2ndIndicatorsList").onchange = ChangeDotLayerIndicator;

    //Starting point
    StartLoading();
    FillCountriesMenu();
    FillDateMenu();
    var defaultFirstIndicator = "AttackRate";
    var defaultSecondIndicator = "MortalityRate";
    CreateDotRenderer(foreGroundLayer, defaultSecondIndicator)
    CreatePolygonRenderer(backGroundLayer, defaultFirstIndicator);
    SetIconsColor()
    AddLayersToMap(backGroundLayer, foreGroundLayer, disputedBoundaries)
    setTimeout(EndLoading, 1000);

    const legend = new Legend({
        view: view,
    });

    legendExpand = new Expand({
        expandIconClass: "esri-icon-legend \ue90c", 
        expandTooltip: "Expand legend",
        view: view,
        content: legend,
      });
      view.ui.add(legendExpand, "bottom-left");
   
    view.ui.add("filters", "top-left");
    view.ui.add("Indicators", "top-left");
    view.ui.add("filteringIcon", "top-right");

    view.ui.move("zoom", "top-right");
    let homeWidget = new Home({ view: view });
    view.ui.add(homeWidget, "top-right");
   
    document.getElementById("filteringIcon").addEventListener("click", () => {
        let filters = document.getElementById("filters");
        filters.style.display =
            filters.style.display === "block" ? "none" : "block";
    });

});
