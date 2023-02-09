import { ButtplugClient, ButtplugClientDevice } from "buttplug";
import { ButtplugBrowserWebsocketClientConnector } from "buttplug/dist/main/src/client/ButtplugBrowserWebsocketClientConnector";
import { useEffect, useRef, useState } from "react";

type Device = {
  intensities: {
    vibration: number;
    rotation: number;
  };
};

const Massager = () => {
  const devices = useRef<ButtplugClientDevice[]>([]);
  const [deviceDatas, setDeviceDatas] = useState<Device[]>([]);
  console.log(deviceDatas);

  const getDevice = (index: number) => devices.current[index];

  const setDeviceIntensity = async (
    index: number,
    type: keyof Device["intensities"],
    intensity: number
  ) => {
    const newDeviceDatas = structuredClone(deviceDatas);
    newDeviceDatas[index].intensities[type] = intensity;
    const device = getDevice(index);
    try {
      switch (type) {
        case "vibration":
          await device.vibrate(intensity);
          break;
        case "rotation":
          await device.rotate(intensity, true);
          break;
      }
    } catch (e) {
      console.log(e);
    }
    setDeviceDatas(newDeviceDatas);
  };

  useEffect(() => {
    (async () => {
      const connector = new ButtplugBrowserWebsocketClientConnector(
        "ws://192.168.1.85:12345"
      );
      const client = new ButtplugClient("Device Control Example");
      client.addListener(
        "deviceadded",
        async (device: ButtplugClientDevice) => {
          console.log(`Device Connected: ${device.name}`);
          devices.current.push(device);
          setDeviceDatas((deviceDatas) => [
            ...deviceDatas,
            {
              intensities: { vibration: 0, rotation: 0 },
            },
          ]);
        }
      );
      client.addListener("deviceremoved", (device) =>
        console.log(`Device Removed: ${device.name}`)
      );
      await client.connect(connector);
      await client.startScanning();
    })();
  }, []);

  const pulseVibrateDevice = async (device: ButtplugClientDevice) => {
    console.log("Sending vibrate command");
    try {
      await device.vibrate(1.0);
    } catch (e) {
      console.log(e);
    }
    await new Promise((r) => setTimeout(r, 1000));
    await device.stop();
  };

  const pulseRotateDevice = async (device: ButtplugClientDevice) => {
    console.log("Sending rotate command");
    try {
      await device.rotate(1.0, true);
    } catch (e) {
      console.log(e);
    }
    await new Promise((r) => setTimeout(r, 5000));
    await device.stop();
  };

  return (
    <div>
      {deviceDatas.map(({ intensities: { vibration, rotation } }, i) => (
        <div key={i}>
          <p>{getDevice(i).name}</p>
          {getDevice(i).vibrateAttributes.length > 0 && (
            <div>
              <button onClick={() => pulseVibrateDevice(getDevice(i))}>
                Vibrate
              </button>
              <input
                type="range"
                value={vibration}
                min="0"
                max="1"
                step="0.01"
                onChange={(e) =>
                  setDeviceIntensity(i, "vibration", e.target.valueAsNumber)
                }
              />
              <p>{vibration}</p>
            </div>
          )}
          {getDevice(i).rotateAttributes.length > 0 && (
            <div>
              <button onClick={() => pulseRotateDevice(getDevice(i))}>
                Rotate
              </button>
              <input
                type="range"
                value={rotation}
                min="0"
                max="1"
                step="0.01"
                onChange={(e) =>
                  setDeviceIntensity(i, "rotation", e.target.valueAsNumber)
                }
              />
              <p>{rotation}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Massager;
