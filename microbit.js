// 接続するBluetoothデバイス
let targetDevice = null;

// 最初に受信した温度
let initialTemperature = 999;

// micro:bit 温度サービス
const TEMPERATURE_SERVICE = "e95d6100-251d-470a-a062-fa1922dfa9a8";

// micro:bit 温度データキャラクタリスティック
const TEMPERATURE_DATA = "e95d9250-251d-470a-a062-fa1922dfa9a8";

// micro:bit 温度取得間隔キャラクタリスティック
const TEMPERATURE_PERIOD = "e95d1b25-251d-470a-a062-fa1922dfa9a8";

function onClickStartButton() {
  if (!navigator.bluetooth) {
    alert("Web Bluetooth is not supported.")
    return;
  }

  requestDevice();
}

function onClickStopButton() {
  if (!navigator.bluetooth) {
    alert("Web Bluetooth is not supported.")
    return;
  }

  initialTemperature = 999;
  document.getElementsByClassName("background")[0].style.backgroundColor = "#ffffff";
  disconnect();
}

function requestDevice() {
  navigator.bluetooth.requestDevice({
    filters: [
      { services: [TEMPERATURE_SERVICE] },
      { namePrefix: "BBC micro:bit" }
    ]
  })
    .then(device => {
      targetDevice = device;
      connect(targetDevice);
    })
    .catch(error => {
      alert(error);
      targetDevice = null;
    });
}

function disconnect() {
  if (targetDevice == null) {
    alert('target device is null.');
    return;
  }

  targetDevice.gatt.disconnect();
}

function connect(device) {
  device.gatt.connect()
    .then(server => {
      findTemperatureService(server);
    })
    .catch(error => {
      alert(error);
    });
}

// 温度を表示する
function updateTemperatureValue(temperature) {
  document.getElementsByName("Temperature")[0].innerHTML = temperature + "℃";

  if (initialTemperature == 999) {
    initialTemperature = temperature;
  }

  let diff = Math.abs(initialTemperature - temperature);

  if (diff > 5) {
    diff = 5;
  }

  let strR = "ff";
  let strG = "ff";
  let strB = "ff";

  if (initialTemperature - temperature < 0) {
    strG = (255 - diff * 16).toString(16);
    strB = (255 - diff * 16).toString(16);
  } else if (initialTemperature - temperature > 0) {
    strR = (255 - diff * 16).toString(16);
    strG = (255 - diff * 16).toString(16);
  }

  document.body.style.backgroundColor = "#" + strR + strG + strB;
}

function findTemperatureService(server) {
  server.getPrimaryService(TEMPERATURE_SERVICE)
    .then(service => {
      findTemperaturePeriodCharacteristic(service);
      findTemperatureCharacteristic(service);
    })
    .catch(error => {
      alert(error);
    });
}

function findTemperaturePeriodCharacteristic(service) {
  service.getCharacteristic(TEMPERATURE_PERIOD)
    .then(characteristic => {
      writeTemperaturePeriodValue(characteristic);
    })
    .catch(error => {
      alert(error);
    });
}

function writeTemperaturePeriodValue(characteristic) {
  characteristic.writeValue(new Uint16Array([160]))
    .catch(error => {
      alert(error);
    });
}

function findTemperatureCharacteristic(service) {
  service.getCharacteristic(TEMPERATURE_DATA)
    .then(characteristic => {
      startTemperatureNotification(characteristic);
    })
    .catch(error => {
      alert(error);
    });
}

function startTemperatureNotification(characteristic) {
  characteristic.startNotifications()
    .then(char => {
      characteristic.addEventListener('characteristicvaluechanged',
        onTemperatureChanged);
    });
}

function onTemperatureChanged(event) {
  let bearing = event.target.value.getInt8(0, true);
  updateTemperatureValue(bearing);
}
