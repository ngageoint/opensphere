goog.require('plugin.cesium.primitive');
goog.require('test.plugin.cesium.primitive');

describe('plugin.cesium.primitive', () => {
  const {isGroundPrimitive, isPrimitiveShown, setPrimitiveShown} = goog.module.get('plugin.cesium.primitive');
  const primitiveUtils = goog.module.get('test.plugin.cesium.primitive');

  describe('isGroundPrimitive', () => {
    it('should not detect normal primitives as ground primitives', () => {
      const billboard = primitiveUtils.createBillboard([0, 0, 0]);
      const primitive = primitiveUtils.createPrimitive([-5, -5, 5, 5]);
      const pointPrimitive = primitiveUtils.createPointPrimitive([0, 0]);
      const polyline = primitiveUtils.createPolyline([[0, 0], [10, 10]]);

      expect(isGroundPrimitive(primitive)).toBe(false);
      expect(isGroundPrimitive(pointPrimitive)).toBe(false);
      expect(isGroundPrimitive(billboard)).toBe(false);
      expect(isGroundPrimitive(polyline)).toBe(false);

      const primitiveCollection = new Cesium.PrimitiveCollection();
      expect(isGroundPrimitive(primitiveCollection)).toBe(false);
      primitiveCollection.add(primitive);
      expect(isGroundPrimitive(primitiveCollection)).toBe(false);

      const billboardCollection = new Cesium.BillboardCollection();
      expect(isGroundPrimitive(billboardCollection)).toBe(false);
      billboardCollection.add(billboard);
      expect(isGroundPrimitive(billboardCollection)).toBe(false);

      const polylineCollection = new Cesium.PolylineCollection();
      expect(isGroundPrimitive(polylineCollection)).toBe(false);
      polylineCollection.add(polyline);
      expect(isGroundPrimitive(polylineCollection)).toBe(false);
    });

    it('should detect ground primitives', () => {
      const groundPrimitive = primitiveUtils.createGroundPrimitive([0, 0, 10, 10]);
      expect(isGroundPrimitive(groundPrimitive)).toBe(true);
      const groundPolyline = primitiveUtils.createGroundPolylinePrimitive([[0, 0], [10, 10]]);
      expect(isGroundPrimitive(groundPolyline)).toBe(true);

      const primitiveCollection = new Cesium.PrimitiveCollection();
      expect(isGroundPrimitive(primitiveCollection)).toBe(false);
      primitiveCollection.add(groundPrimitive);
      expect(isGroundPrimitive(primitiveCollection)).toBe(true);
      primitiveCollection.removeAll();
      primitiveCollection.add(groundPolyline);
      expect(isGroundPrimitive(primitiveCollection)).toBe(true);
    });
  });

  describe('isPrimitiveShown', () => {
    it('should read generic primitives directly', () => {
      const billboard = primitiveUtils.createBillboard([0, 0, 0]);
      const primitive = primitiveUtils.createPrimitive([-5, -5, 5, 5]);
      const pointPrimitive = primitiveUtils.createPointPrimitive([0, 0]);
      const polyline = primitiveUtils.createPolyline([[0, 0], [10, 10]]);

      // We are considering anything which directly implements a "show" field as "generic"
      const primitiveCollection = new Cesium.PrimitiveCollection();

      const genericPrimitives = [billboard, primitive, pointPrimitive, polyline, primitiveCollection];

      genericPrimitives.forEach((item) => {
        item.show = true;
        expect(isPrimitiveShown(item)).toBe(item.show);
        item.show = false;
        expect(isPrimitiveShown(item)).toBe(item.show);
      });
    });

    it('should default primitive collections to shown', () => {
      const billboardCollection = new Cesium.BillboardCollection();
      const polylineCollection = new Cesium.PolylineCollection();

      const collections = [billboardCollection, polylineCollection];
      collections.forEach((collection) => {
        expect(isPrimitiveShown(collection)).toBe(true);
      });
    });

    it('should get the shown value of the first item for collections', () => {
      const billboardCollection = new Cesium.BillboardCollection();
      const polylineCollection = new Cesium.PolylineCollection();

      const billboard = primitiveUtils.createBillboard([0, 0, 0]);
      billboard.show = false;
      billboardCollection.add(billboard);

      const polyline = primitiveUtils.createPolyline([[0, 0], [10, 10]]);
      polyline.show = false;
      polylineCollection.add(polyline);

      const collections = [billboardCollection, polylineCollection];
      collections.forEach((collection) => {
        expect(isPrimitiveShown(collection)).toBe(false);
      });
    });
  });

  describe('setPrimitiveShown', () => {
    it('should set generic primitives directly', () => {
      const billboard = primitiveUtils.createBillboard([0, 0, 0]);
      const primitive = primitiveUtils.createPrimitive([-5, -5, 5, 5]);
      const pointPrimitive = primitiveUtils.createPointPrimitive([0, 0]);
      const polyline = primitiveUtils.createPolyline([[0, 0], [10, 10]]);

      // We are considering anything which directly implements a "show" field as "generic"
      const primitiveCollection = new Cesium.PrimitiveCollection();

      const genericPrimitives = [billboard, primitive, pointPrimitive, polyline, primitiveCollection];

      genericPrimitives.forEach((item) => {
        setPrimitiveShown(item, false);
        expect(isPrimitiveShown(item)).toBe(false);
        setPrimitiveShown(item, true);
        expect(isPrimitiveShown(item)).toBe(true);
      });
    });

    it('should set the shown value of all items in collections', () => {
      const billboardCollection = new Cesium.BillboardCollection();
      const billboard1 = primitiveUtils.createBillboard([0, 0, 0]);
      const billboard2 = primitiveUtils.createBillboard([1, 1, 1]);
      billboardCollection.add(billboard1);
      billboardCollection.add(billboard2);

      const polylineCollection = new Cesium.PolylineCollection();
      const polyline1 = primitiveUtils.createPolyline([[0, 0], [10, 10]]);
      const polyline2 = primitiveUtils.createPolyline([[-20, 20], [10, 10]]);
      polylineCollection.add(polyline1);
      polylineCollection.add(polyline2);

      const collections = [billboardCollection, polylineCollection];
      collections.forEach((collection) => {
        setPrimitiveShown(collection, false);
        for (let i = 0, n = collection.length; i < n; i++) {
          expect(isPrimitiveShown(collection.get(i))).toBe(false);
        }
        setPrimitiveShown(collection, true);
        for (let i = 0, n = collection.length; i < n; i++) {
          expect(isPrimitiveShown(collection.get(i))).toBe(true);
        }
      });
    });
  });
});
