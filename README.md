[![Go to Gunnebo](logo.png)](http://gunnebo.com)

# node-red-contrib-prolights
Node-RED node that composes input for [node-red-contrib-artnet](https://github.com/gunnebo-ab/node-red-contrib-artnet) to control [Prolights](https://www.musiclights.it/prolights.html) lights.

[Gunnebo](http://www.gunnebo.com/)  (OMX: GUNN) is a multinational corporation headquartered in Gothenburg, Sweden, specializing in security products, services and solutions mainly in the areas of cash management, entrance security, electronic security and safes & vaults. The Gunnebo Group has operations in 32 countries with approximately 5,500 employees (Jan 2016) and a reported global revenue of ˆ660 million for 2015. Gunnebo has been listed on the Stockholm Stock Exchange in Sweden since 1994 and can be found on the NASDAQ OMX Nordic Exchange Stockholm in the Mid Cap Industrials segment.

## Install

Run the following command in the root directory of your Node-RED install. Usually this is `~/.node-red`
```
npm install node-red-contrib-prolights
```

## Using

You can either setup node via editor or with a payload like the following example:

```
msg.payload = {
  device_type: "PIXIEWASH",
  channels: "13channels",
  address_start: 1,
  pan: 100,
  tilt:140,
  dimmer:20,
  shutter:3,
  red:10,
  green:10,
  zoom:255
};
```

You can also fade to values, either for a single channel or multiple channels. You must specify the 'transition' and also a 'duration' in milliseconds:

```
msg.payload = {
  device_type: "PIXIEWASH",
  channels: "13channels",
  address_start: 1,
  transition: true,
  duration: 4000,
  red:10,
  zoom:255
};
```
While configuring node via editor you can specify "-1" as a value for any channel. In that case channel value doesn't change.