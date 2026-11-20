'use strict';

function initDealerMap(){
  const canvas=document.createElement('div');canvas.className='ymap';
  mapHost.prepend(canvas);
  const mobile=matchMedia('(pointer:coarse)').matches;
  dealerMap=new ymaps.Map(canvas,{center:[55,65],zoom:3,controls:['zoomControl'],
    behaviors:mobile?['multiTouch']:['drag','dblClickZoom']});
  const layout=html=>ymaps.templateLayoutFactory.createClass(html);
  layouts={normal:layout('<div class="dealer-pin"></div>'),selected:layout('<div class="dealer-pin selected"></div>')};
  const shape={type:'Circle',coordinates:[0,0],radius:20};
  markers=new Map(points.map(p=>{
    const pin=new ymaps.Placemark(p.latlng,{hintContent:esc(p.city+' · '+storeName(directory[p.i]))},
      {iconLayout:p===activePoint?layouts.selected:layouts.normal,iconShape:shape,openBalloonOnClick:false});
    pin.events.add('click',()=>{cancelLocate();renderCity(p.city,p)});
    return [p,pin];
  }));
  cluster=new ymaps.Clusterer({clusterIconLayout:layout('<div class="dealer-pin cluster"><b>$[properties.geoObjects.length]</b></div>'),
    clusterIconShape:shape,gridSize:64,clusterDisableClickZoom:false});
  cityLayer=new ymaps.GeoObjectCollection();
  widget.hidden=true;showDealerPins();
}

const dealerMapSdk = document.createElement('script');
dealerMapSdk.src = 'https://api-maps.yandex.ru/2.1/?' + new URLSearchParams({
  lang: 'ru_RU',
  apikey: "f97e0227-a124-40dd-9f8b-64b2620bda5c"
});
dealerMapSdk.onload = () => window.ymaps?.ready(initDealerMap);
document.head.append(dealerMapSdk);
