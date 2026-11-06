export interface SettingsPageViewProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export interface ViewContracts {
  "settings.page": SettingsPageViewProps;
}
