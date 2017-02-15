module.exports = function (RED) {
    function ProlightsNode(config) {
        RED.nodes.createNode(this, config);

        const node = this;

        node.data_source = config.data_source;

        this.hexToRgb = function (hex) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };

        this.findObjectById = function (id, array) {
            return array.find(function (element, index, array) {
                return element.Type.Id == id;
            });
        };

        function removeChannelByIndex(arr, index) {
            for(var i = 0; i < arr.length; i++) {
                if(arr[i].channel === index) {
                    arr.splice(i, 1);
                    return;
                }
            }
        }

        function pushValue(arr, index, v) {
            if(checkValue(v)) {
                removeChannelByIndex(arr, index);
                arr.push({channel:index, value:v});
                return v;
            }
            return -1;
        }

        function getValue(name, c, p) {
            var fromPayload = node.data_source === 'payload' || node.data_source === "configuration_payload";
            return fromPayload ? (p.hasOwnProperty(name) ? p[name] : -1) : (c.hasOwnProperty(name) ? c[name] : -1);
        }

        function checkValue(v) {
            return v > -1 && v < 256;
        }

        function parseLUMIPAR12UTRI(payload) {
            var buckets = payload.buckets || [];
            var conf = {};
            conf.channels = node.data_source !== 'payload' ? config.channels : (payload.channels || "3channels");
            conf.address_start = node.data_source !== 'payload' ? config.address_start : (payload.address_start || 1);

            var isChannelsFromPayload = node.data_source === 'payload' || node.data_source === "configuration_payload";
            var isChannelsFromConfig = node.data_source === 'configuration';

            var is8Channels = conf.channels == "8channels";

            var index = conf.address_start;

            if(isChannelsFromPayload || isChannelsFromConfig){
                conf.red = pushValue(buckets, index++, getValue("red", config, payload));
                conf.green = pushValue(buckets, index++, getValue("green", config, payload));
                conf.blue = pushValue(buckets, index++, getValue("blue", config, payload));

                if(is8Channels) {
                    conf.color = pushValue(buckets, index++, getValue("color", config, payload));
                    conf.strobe = pushValue(buckets, index++, getValue("strobe", config, payload));
                    conf.program = pushValue(buckets, index++, getValue("program", config, payload));
                    conf.dimmer = pushValue(buckets, index++, getValue("dimmer", config, payload));
                    conf.dimmer_speed = pushValue(buckets, index++, getValue("dimmer_speed", config, payload));
                }
            } else {
                var parameters = payload.ParameterList.Parameter;
                var colorStateObject = node.findObjectById(57, parameters);
                var powerStateObject = node.findObjectById(56, parameters);

                if(powerStateObject && is8Channels) {
                    conf.dimmer = pushValue(buckets, conf.address_start+6, powerStateObject.Value === "on" ? 255 : 0 );
                }

                if(colorStateObject){
                    var colorState = colorStateObject.Value;
                    var colors = ["Red", "Green", "Blue"];
                    var colorsIndexes = [0, 1, 2];

                    var colorIndex = colors.indexOf(colorState);
                    if(colorIndex != -1){
                        conf[colors[colorIndex].toLocaleLowerCase()] = pushValue(buckets, conf.address_start + colorsIndexes[colorIndex], 255);
                    }

                    var htoR = node.hexToRgb(colorState);
                    var rgb = /\((\d{1,3})\,(\d{1,3})\,(\d{1,3})\)/.exec(colorState);
                    if(rgb && rgb.length == 4){
                        htoR = {r: rgb[1],g: rgb[2], b: rgb[3]};
                    }

                    if(htoR){
                        conf.red = pushValue(buckets, conf.address_start, htoR.r);
                        conf.green = pushValue(buckets, conf.address_start+1, htoR.g);
                        conf.blue = pushValue(buckets, conf.address_start+2, htoR.b);
                    }
                }
            }
            return buckets;
        }

        function parseLUMIPAR12UQPRO(payload) {
            var buckets = payload.buckets || [];
            var conf = {};

            conf.channels = node.data_source !== 'payload' ? config.channels : (payload.channels || "4channels");
            conf.address_start = node.data_source !== 'payload' ? config.address_start : (payload.address_start || 1);

            var isChannelsFromPayload = node.data_source === 'payload' || node.data_source === "configuration_payload";
            var isChannelsFromConfig = node.data_source === 'configuration';

            var is9Channels = conf.channels == "9channels";

            var index = conf.address_start;

            if(isChannelsFromPayload || isChannelsFromConfig){
                conf.red = pushValue(buckets, index++, getValue("red", config, payload));
                conf.green = pushValue(buckets, index++, getValue("green", config, payload));
                conf.blue = pushValue(buckets, index++, getValue("blue", config, payload));
                conf.white = pushValue(buckets, index++, getValue("white", config, payload));

                if(is9Channels) {
                    conf.color = pushValue(buckets, index++, getValue("color", config, payload));
                    conf.strobe = pushValue(buckets, index++, getValue("strobe", config, payload));
                    conf.program = pushValue(buckets, index++, getValue("program", config, payload));
                    conf.dimmer = pushValue(buckets, index++, getValue("dimmer", config, payload));
                    conf.dimmer_speed = pushValue(buckets, index++, getValue("dimmer_speed", config, payload));
                }
            } else {
                var parameters = payload.ParameterList.Parameter;
                var colorStateObject = node.findObjectById(57, parameters);
                var powerStateObject = node.findObjectById(56, parameters);

                if(powerStateObject) {
                    var powerState = powerStateObject.Value === "on" ? 255 : 0;
                    if(is9Channels) {
                        conf.dimmer = pushValue(buckets, conf.address_start + 7, powerState);
                    }
                    if(colorStateObject) {
                        var colorState = colorStateObject.Value;
                        var colors = ["Red", "Green", "Blue", "White"];
                        var colorsIndexes = [0, 1, 2, 3];

                        var colorIndex = colors.indexOf(colorState);
                        if(colorIndex != -1){
                            conf[colors[colorIndex].toLocaleLowerCase()] = pushValue(buckets, conf.address_start + colorsIndexes[colorIndex], 255);
                        }

                        var htoR = node.hexToRgb(colorState);
                        var rgb = /\((\d{1,3})\,(\d{1,3})\,(\d{1,3})\)/.exec(colorState);
                        if(rgb && rgb.length == 4){
                            htoR = {r: rgb[1],g: rgb[2], b: rgb[3]};
                        }

                        if(htoR){
                            conf.red = pushValue(buckets, conf.address_start, htoR.r);
                            conf.green = pushValue(buckets, conf.address_start+1, htoR.g);
                            conf.blue = pushValue(buckets, conf.address_start+2, htoR.b);
                        }
                    } else {
                        conf.white = pushValue(buckets, conf.address_start + 3, powerState);
                    }
                }
            }
            return buckets;
        }

        function parseLUMIPAR12UAW(payload) {
            var buckets = payload.buckets || [];
            var conf = {};
            conf.channels = node.data_source !== 'payload' ? config.channels : (payload.channels || "3channels");
            conf.address_start = node.data_source !== 'payload' ? config.address_start : (payload.address_start || 1);

            var isChannelsFromPayload = node.data_source === 'payload' || node.data_source === "configuration_payload";
            var isChannelsFromConfig = node.data_source === 'configuration';

            var is7Channels = conf.channels == "7channels";

            var index = conf.address_start;

            if(isChannelsFromPayload || isChannelsFromConfig){
                conf.amber = pushValue(buckets, index++, getValue("amber", config, payload));
                conf.cold_white = pushValue(buckets, index++, getValue("cold_white", config, payload));
                conf.warm_white = pushValue(buckets, index++, getValue("warm_white", config, payload));

                if(is7Channels) {
                    conf.strobe = pushValue(buckets, index++, getValue("strobe", config, payload));
                    conf.program = pushValue(buckets, index++, getValue("program", config, payload));
                    conf.dimmer = pushValue(buckets, index++, getValue("dimmer", config, payload));
                    conf.dimmer_speed = pushValue(buckets, index++, getValue("dimmer_speed", config, payload));
                }
            } else {
                var parameters = payload.ParameterList.Parameter;
                var powerStateObject = node.findObjectById(56, parameters);

                if(powerStateObject && is7Channels) {
                    var powerState = powerStateObject.Value === "on" ? 255 : 0;
                    conf.cold_white = pushValue(buckets, conf.address_start + 1, powerState);
                    if(is7Channels) {
                        conf.dimmer = pushValue(buckets, conf.address_start + 5, powerState);
                    }
                }
            }
            return buckets;
        }

        function parsePIXIEWASH(payload) {
            var buckets = payload.buckets || [];
            var conf = {};
            conf.channels = node.data_source !== 'payload' ? config.channels : (payload.channels || "13channels");
            conf.address_start = node.data_source !== 'payload' ? config.address_start : (payload.address_start || 1);

            var isChannelsFromPayload = node.data_source === 'payload' || node.data_source === "configuration_payload";
            var isChannelsFromConfig = node.data_source === 'configuration';
            
            var is16Channels = conf.channels == "16channels";

            var index = conf.address_start;

            if(isChannelsFromPayload || isChannelsFromConfig){
                conf.pan = pushValue(buckets, index++, getValue("pan", config, payload));
                conf.pan_fine = pushValue(buckets, index++, getValue("pan_fine", config, payload));
                conf.tilt = pushValue(buckets, index++, getValue("tilt", config, payload));
                conf.tilt_fine = pushValue(buckets, index++, getValue("tilt_fine", config, payload));
                conf.pan_tilt_speed = pushValue(buckets, index++, getValue("pan_tilt_speed", config, payload));
                conf.special_function = pushValue(buckets, index++, getValue("special_function", config, payload));
                conf.dimmer = pushValue(buckets, index++, getValue("dimmer", config, payload));
                conf.shutter = pushValue(buckets, index++, getValue("shutter", config, payload));
                conf.red = pushValue(buckets, index++, getValue("red", config, payload));
                conf.green = pushValue(buckets, index++, getValue("green", config, payload));
                conf.blue = pushValue(buckets, index++, getValue("blue", config, payload));
                conf.white = pushValue(buckets, index++, getValue("white", config, payload));

                if(is16Channels) {
                    conf.color_function = pushValue(buckets, index++, getValue("color_function", config, payload));
                    conf.color = pushValue(buckets, index++, getValue("color", config, payload));
                    conf.zoom = pushValue(buckets, index++, getValue("zoom", config, payload));
                    conf.dimmer_speed = pushValue(buckets, index++, getValue("dimmer_speed", config, payload));
                } else {
                    conf.zoom = pushValue(buckets, index++, getValue("zoom", config, payload));
                }
            } else {
                var parameters = payload.ParameterList.Parameter;
                var colorStateObject = node.findObjectById(57, parameters);
                var powerStateObject = node.findObjectById(56, parameters);

                if(powerStateObject) {
                    var powerState = powerStateObject.Value === "on" ? 255 : 0;
                    conf.dimmer = pushValue(buckets, conf.address_start + 6, powerState);

                    if(colorStateObject){
                        var colorState = colorStateObject.Value;
                        var colors = ["Red", "Green", "Blue", "White"];
                        var colorsIndexes = [8, 9, 10, 11];

                        var colorIndex = colors.indexOf(colorState);
                        if(colorIndex != -1){
                            conf[colors[colorIndex].toLocaleLowerCase()] = pushValue(buckets, conf.address_start + colorsIndexes[colorIndex], 255);
                        }

                        var htoR = node.hexToRgb(colorState);
                        var rgb = /\((\d{1,3})\,(\d{1,3})\,(\d{1,3})\)/.exec(colorState);
                        if(rgb && rgb.length == 4){
                            htoR = {r: rgb[1],g: rgb[2], b: rgb[3]};
                        }

                        if(htoR){
                            conf.red = pushValue(buckets, conf.address_start + 8, htoR.r);
                            conf.green = pushValue(buckets, conf.address_start + 9, htoR.g);
                            conf.blue = pushValue(buckets, conf.address_start + 10, htoR.b);
                        }
                    } else {
                        conf.white = pushValue(buckets, conf.address_start + 11, powerState);
                    }
                }
            }
            return buckets;
        }

        this.on('input', function (msg) {
            var payload = msg.payload;

            var device_type = node.data_source !== 'payload' ? config.device_type : (payload.device_type || "LUMIPAR12UTRI");
            var transition = (node.data_source !== 'payload' ? config.transition : payload.transition) || false;
            var duration = (node.data_source !== 'payload' ? config.duration : payload.duration)  || 0;

            var isTransition = transition && duration > 0;

            if(isTransition){
                var startBuckets = payload.buckets || [];
                if(payload.buckets){
                    payload.buckets = [];
                }
            }

            var buckets = [];
            switch(device_type) {
                case "LUMIPAR12UTRI":
                    //https://www.manualslib.com/manual/1087013/Prolights-Lumipar-12utri.html?page=31#manual
                    buckets = parseLUMIPAR12UTRI(payload);
                    break;
                case "LUMIPAR12UQPRO":
                    //https://www.musiclights.it/product/LUMIPAR12UQPRO?lang=EN
                    buckets = parseLUMIPAR12UQPRO(payload);
                    break;
                case "LUMIPAR12UAW":
                    //https://www.distrixs.nl/wp-content/uploads/woocommerce_uploads/2016/01/LUMIPAR12UAW_manuale.pdf
                    buckets = parseLUMIPAR12UAW(payload);
                    break;
                case "PIXIEWASH":
                    //https://www.distrixs.nl/catalog/prolights/moving-head/led-moving-head/prolights-pixiewash/
                    buckets = parsePIXIEWASH(payload);
                    break;
                case "LUMIPAR7UTRI":
                    //https://www.musiclights.it/product/LUMIPAR7UTRI?lang=EN
                    buckets = parseLUMIPAR12UTRI(payload);
                    break;
            }

            var result = {buckets: buckets};

            if(isTransition){
                if(startBuckets.length > 0){
                    result.start_buckets = startBuckets;
                }
                result.transition = "linear";
                result.duration = duration;
            }
            node.send({payload:result});
        });
    }

    RED.nodes.registerType("prolights out", ProlightsNode);
};
