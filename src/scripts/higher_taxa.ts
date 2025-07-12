/*
Higher taxa classification for mammals
*/
import { getHierarchicalTaxonData, type OrderData } from "../scripts/taxon_table";

export interface SubclassData {
    subclass: string;
    infraclass: InfraClassData[];
}

interface InfraClassData {
  infraclass: string;
  orders: OrderData[];
}


function getInfraClassData(data: Record<string, OrderData>, infraClass: string): OrderData[] {
  return Object.values(data).filter(
    (item: OrderData) => item.infraclass && item.infraclass.includes(infraClass)
  );
}

function getSubclassData(data: Record<string, OrderData>, subclass: string): OrderData[] {
  return Object.values(data).filter(
    (item: OrderData) => item.subclass && item.subclass.includes(subclass)
  );
}

function getHigherTaxonData(): Record<string, SubclassData> {
  const higherTaxaData: Record<string, SubclassData> = {};

  const orderData = getHierarchicalTaxonData();
  const infraClasses = new Set<string>();

  for (const order of Object.values(orderData)) {
    if (order.infraclass) {
      infraClasses.add(order.infraclass);
    }
  }

  for (const infraclass of infraClasses) {
    const ordersInInfraClass = getInfraClassData(orderData, infraclass);
    const subclasses = Array.from(new Set(ordersInInfraClass.map(order => order.subclass).filter(Boolean)));

    for (const subclass of subclasses) {
      const ordersInSubclass = getSubclassData(orderData, subclass);
      const infraclasses = Array.from(new Set(ordersInSubclass.map(order => order.infraclass).filter(Boolean)));

      const infraClassDataArr: InfraClassData[] = infraclasses.map((infraclass) => ({
        infraclass,
        orders: getInfraClassData(orderData, infraclass)
      }));

      higherTaxaData[subclass] = {
        subclass,
        infraclass: infraClassDataArr
      };
    }
  }

  return higherTaxaData;
}

export { getHigherTaxonData };