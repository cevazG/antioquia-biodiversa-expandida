document.addEventListener('DOMContentLoaded', async () => {
      await Promise.all([I18n.init(), DataStore.init()]);

      MapController.init('map-container', (region) => {
        Nav.go('subregion.html', { subregion: region.id });
      });
    });
