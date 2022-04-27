require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/widgets/Legend",
    "esri/layers/GeoJSONLayer",
    "esri/widgets/Home",
    "esri/widgets/BasemapGallery",
    "esri/config",
    "esri/smartMapping/renderers/color",
    "esri/smartMapping/symbology/color",
    "esri/smartMapping/symbology/support/colorRamps",
    "esri/layers/GraphicsLayer",
], (
    Map,
    MapView,
    FeatureLayer,
    Legend,
    GeoJSONLayer,
    Home,
    BasemapGallery,
    esriConfig,
    colorRendererCreator,
    colorSymbology,
    colorRamps,
    Graphic
) => {
    esriConfig.apiKey =
        "AAPKe44b10789165473bbb2ed24e27e5a9f9tAJ4hB35ju4KTciHnmADukI2pL1KgoM-PNcxhZJswrhJQOM2ph5rRAXkm-D_-abA";
    const nationalUrl =
        "https://services3.arcgis.com/1FS0hEOLnjHnov75/arcgis/rest/services/WHO_EMRO_GD_20220417_ThematicMap/FeatureServer/0";
    const nationalViewUrl =
        "https://services3.arcgis.com/1FS0hEOLnjHnov75/arcgis/rest/services/WHO_EMRO_GD_20220417_ThematicMap/FeatureServer/4";
    const disputedBoundariesUrl =
        "https://services3.arcgis.com/1FS0hEOLnjHnov75/arcgis/rest/services/EMRO_Disputed_boundaries_FGDB/FeatureServer"

    const classificationMethod = "natural-breaks";
    const numClasses = 5;

    const nationalLevel = new FeatureLayer({
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
        center: [25, 20],
        zoom: 3,
    });

    const defaultScheme = colorSymbology.getSchemeByName({
        basemap: map.basemap,
        geometryType: "polygon",
        theme: "above-and-below",
        name: "Esri Green and Blue 4",
    });

    function GetColorRampName(variable) {
        switch (variable) {
            case "AttackRate":
                return "Esri Pumpkin Pie";
            case "CFR":
                return "Red 8";
            case "sampleTested":
                return "Purple 9";
            case "MortalityRate":
                return "Esri Red 1";
            case "RecoveryRate":
                return "Esri Green 2";
            case "RecoveryRate":
                return "Esri Green 2";
        }
    }
    function generateRenderer(featureLayer, variable) {
        featureLayer.title = GetLabel(variable) //"0-Map legend";
        var colorRampName = GetColorRampName(variable);
        defaultScheme.colorsForClassBreaks =
            colorRamps.byName(colorRampName).colorsForClassBreaks;
        const colorScheme = colorSymbology.flipColors(defaultScheme);
        const params = {
            layer: featureLayer,
            view: view,
            field: variable,
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
                featureLayer.popupTemplate = GetPopUpTemplate(variable);
                featureLayer.popupTemplate.title = "{Name}";

                map.add(featureLayer);
                map.add(disputedBoundaries)
                // featureLayer.queryFeatures().then((res)=>{console.log(res.features)})

                return rendererResponse.renderer;
            });
        // .then(function (returnedRendered) {
        //   const nationalLevelRenderLayer = new FeatureLayer({
        //     url: nationalUrl,
        //     renderer: returnedRendered,
        //     title: "Emro Countries",
        //     popupTemplate: GetPopUpTemplate(variable),
        //   });
        //   map.add(nationalLevelRenderLayer);
        // });
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
        document.getElementById("filteringIcon").style.display = "flex";
        document.getElementById("legendIcon").style.display = "block";
        document.getElementById("basemapGallery").style.display = "block";
        document.getElementById("filters").style.display = "block";
        document.getElementById("viewDiv").style.display = "flex";
    }
    function GetPopUpTemplate(variable) {
        var label = GetLabel(variable);
        const template = {
            title: "{Name}",
            content: [
                {
                    type: "fields",
                    fieldInfos: [
                        {
                            fieldName: variable,
                            label: label,
                            format: {
                                digitSeparator: true,
                                places: 0,
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
    function GetLabel(variable) {
        switch (variable) {
            case "AttackRate":
                return "Confirmed cases per 100,000 population";
            case "CFR":
                return "Case fatality ratio %";
            case "sampleTested":
                return "Tests per 1000,000 population";
            case "RecoveryRate":
                return "Recovery rate %";
            case "MoltarityRate":
                return "Death cases per 100,000 population";
        }
    }
    function FillCountriesMenu() {
        var countrySelector = document.getElementById("countriesList");
        nationalLevel.queryFeatures().then(function (results) {
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

    function ChangeVariable() {
        StartLoading();
        var variable = this.value;
        //Check if specific date selected
        let date = document.getElementById("PeriodDateList").value;
        if (date == "Total") {
            map.removeAll();
            generateRenderer(nationalLevel, variable);
            setTimeout(EndLoading, 1000);
        } else {
            ChangeDate();
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
        StartLoading();
        var periodDataValue = document.getElementById("PeriodDateList").value;
        var variable = document.getElementById("variablesList").value;
        if (periodDataValue == "Total") {
            map.removeAll();
            generateRenderer(nationalLevel, variable);
            setTimeout(EndLoading, 1000);
        } else {
            dataHolder = [];
            let featuresToBeAdded = [];

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

                var lyr = new FeatureLayer({
                    source: geojson.features,
                    fields: [
                        {
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
                    ],
                    objectIdField: "ObjectID_1",
                    geometryType: "polygon",
                });

                nationalLevel.queryFeatures().then(function (results) {
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
                                },
                            })
                        );
                    });

                    const promise = lyr.applyEdits({
                        addFeatures: featuresToBeAdded,
                    });
                    promise.then(() => {
                        map.removeAll();
                        generateRenderer(lyr, variable);
                        setTimeout(EndLoading, 1000);
                    });
                });
            });
        }
    }
    document.getElementById("PeriodDateList").onchange = ChangeDate;

    function ChangeDateType() {
        var periodDataSelector = document.getElementById("PeriodDateList");
        while (periodDataSelector.options.length > 0) {
            periodDataSelector.remove(0);
        }
        if (this.value == "0") {
            //Total
            var variable = document.getElementById("variablesList").value;
            StartLoading();
            map.removeAll();
            generateRenderer(nationalLevel, variable);
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
    StartLoading();
    FillCountriesMenu();
    FillDateMenu();
    var startingVariable = "AttackRate";
    generateRenderer(nationalLevel, startingVariable);
    setTimeout(EndLoading, 1000);

    view.ui.add("filters", "top-left");
    view.ui.add("filteringIcon", "top-right");

    view.ui.move("zoom", "top-right");
    let homeWidget = new Home({ view: view });
    view.ui.add(homeWidget, "top-right");
    view.ui.add("basemapGallery", "top-right");
    view.ui.add("legendIcon", "top-right");
    // view.ui.add("legendIcon", "bottom-left");



    const basemapGallery = new BasemapGallery({
        view: view,
        container: document.createElement("div"),
    });
    const legend = new Legend({
        view: view,
        expanded: true,
        expandIconClass: "esri-icon-legend",
        expandTooltip: "Expand Legend",
    });
    view.ui.add(legend, "bottom-left");

    view.ui.add(basemapGallery, { position: "top-right" });
    basemapGallery.visible = false;

    document.getElementById("basemapGallery").addEventListener("click", () => {
        basemapGallery.visible = !basemapGallery.visible;
    });
    document.getElementById("legendIcon").addEventListener("click", () => {
        legend.visible = !legend.visible;
    });
    document.getElementById("filteringIcon").addEventListener("click", () => {
        let filters = document.getElementById("filters");
        filters.style.display =
            filters.style.display === "block" ? "none" : "block";
    });
});
