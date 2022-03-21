/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Tours
// ====================================================

export interface Tours_tours_meta_pagination {
  __typename: "Pagination";
  total: number;
  pageCount: number;
  page: number;
  pageSize: number;
}

export interface Tours_tours_meta {
  __typename: "ResponseCollectionMeta";
  pagination: Tours_tours_meta_pagination;
}

export interface Tours_tours_data_attributes_image_data_attributes {
  __typename: "UploadFile";
  name: string;
  height: number | null;
  width: number | null;
  formats: any | null;
}

export interface Tours_tours_data_attributes_image_data {
  __typename: "UploadFileEntity";
  id: string | null;
  attributes: Tours_tours_data_attributes_image_data_attributes | null;
}

export interface Tours_tours_data_attributes_image {
  __typename: "UploadFileRelationResponseCollection";
  data: Tours_tours_data_attributes_image_data[];
}

export interface Tours_tours_data_attributes_imagePreview_data_attributes {
  __typename: "UploadFile";
  alternativeText: string | null;
  caption: string | null;
  url: string;
  height: number | null;
  width: number | null;
}

export interface Tours_tours_data_attributes_imagePreview_data {
  __typename: "UploadFileEntity";
  id: string | null;
  attributes: Tours_tours_data_attributes_imagePreview_data_attributes | null;
}

export interface Tours_tours_data_attributes_imagePreview {
  __typename: "UploadFileEntityResponse";
  data: Tours_tours_data_attributes_imagePreview_data | null;
}

export interface Tours_tours_data_attributes {
  __typename: "Tour";
  name: string;
  location: string;
  participant: number | null;
  price: any | null;
  image: Tours_tours_data_attributes_image | null;
  imagePreview: Tours_tours_data_attributes_imagePreview;
  duration: number | null;
  createdAt: any | null;
  updatedAt: any | null;
  publishedAt: any | null;
}

export interface Tours_tours_data {
  __typename: "TourEntity";
  id: string | null;
  attributes: Tours_tours_data_attributes | null;
}

export interface Tours_tours {
  __typename: "TourEntityResponseCollection";
  meta: Tours_tours_meta;
  data: Tours_tours_data[];
}

export interface Tours {
  tours: Tours_tours | null;
}

/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

//==============================================================
// END Enums and Input Objects
//==============================================================
