package com.ferreteria.inventario.util;

import com.ferreteria.inventario.model.Proveedor;
import jakarta.xml.bind.annotation.adapters.XmlAdapter;
import java.util.ArrayList;
import java.util.List;

public class ProveedorListAdapter extends XmlAdapter<ProveedorListAdapter.AdaptedList, List<Proveedor>> {

    @Override
    public List<Proveedor> unmarshal(AdaptedList v) throws Exception {
        if (v == null || v.proveedores == null) {
            return new ArrayList<>();
        }
        return v.proveedores;
    }

    @Override
    public AdaptedList marshal(List<Proveedor> v) throws Exception {
        if (v == null) {
            return new AdaptedList(new ArrayList<>());
        }
        return new AdaptedList(v);
    }

    public static class AdaptedList {
        public List<Proveedor> proveedores;

        public AdaptedList() {
            this.proveedores = new ArrayList<>();
        }

        public AdaptedList(List<Proveedor> proveedores) {
            this.proveedores = proveedores != null ? new ArrayList<>(proveedores) : new ArrayList<>();
        }
    }
}
