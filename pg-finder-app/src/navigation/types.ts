// src/navigation/types.ts
import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootTabParamList = {
  Search: undefined;
  Map: undefined;
  Matches: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<RootTabParamList>;
  ListingDetail: { id: string };
  EditProfile: undefined;
  CreateListing: undefined;
  SavedListings: undefined;
};
