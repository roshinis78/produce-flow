# Produce Flow Analysis

### By Roshini Saravanakumar

 > This page will be updated as I progress 📋

## Resources

<a href='https://github.com/datasets/geo-countries/blob/master/data/countries.geojson'>Geo Countries Dataset</a>
- This dataset contains GeoJSON formatted data of the world.
- I removed the multipolygon for Antartica from this dataset since Antartica does not import, export, or produce crops.


<a href='https://community.periscopedata.com/t/63fy7m/country-centroids'>Country Centroids</a>
- This dataset contains entries of each country and its centroid's longitude and latitude, making it very 
useful as a lookup table.
- I modified some of the country names to update formatting so that it would match the produce dataset. 
- I also appended any missing countries which were countries that had split into two new countries in the recent years.