package com.allpafood.app;

import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.view.View;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Pinta la franja de la hora y la de abajo del mismo color que la pantalla.
 *
 * Sin esto el telefono las deja en un gris propio y el app se ve como una
 * pagina metida dentro de un marco, que es justo lo que delata a una web
 * envuelta. Cada pantalla avisa sus colores al entrar.
 */
@CapacitorPlugin(name = "Barras")
public class BarrasPlugin extends Plugin {

    @PluginMethod
    public void colores(PluginCall call) {
        final int arriba = Color.parseColor(call.getString("arriba", "#FFFFFF"));
        final int abajo = Color.parseColor(call.getString("abajo", call.getString("arriba", "#FFFFFF")));
        final boolean fondoOscuro = call.getBoolean("oscuro", false);

        getActivity().runOnUiThread(() -> {
            View decor = getActivity().getWindow().getDecorView();
            decor.setBackground(new GradientDrawable(
                GradientDrawable.Orientation.TOP_BOTTOM, new int[] { arriba, abajo }));

            WindowInsetsControllerCompat iconos =
                WindowCompat.getInsetsController(getActivity().getWindow(), decor);
            iconos.setAppearanceLightStatusBars(!fondoOscuro);
            iconos.setAppearanceLightNavigationBars(!fondoOscuro);
            call.resolve();
        });
    }
}
