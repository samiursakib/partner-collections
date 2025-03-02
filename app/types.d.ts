export type Product = {
  id: string;
  title: string;
  description: string;
  vendor: string;
  productType: string;
  media: {
    nodes: {
      preview: {
        image: {
          url: string;
          altText: string;
        };
      };
    }[];
  };
  createdAt: string;
  updatedAt: string;
};

export type CreateCollectionPayload = {
  name: string;
  priority: string;
  productIds: string[];
};
