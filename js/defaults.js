{
	let imageNames = `1.png
		2-button_gba_modified.png
		2-button_gba.png
		2-button.png
		2.png
		3-button.png
		4-button.png
		6-button_genesis.png
		6-button.png
		analog.png
		A_nxengine.png
		A.png
		A_right_nxengine.png
		A_wswan.png
		B.png
		B_wswan.png
		c_down.png
		circle.png
		c_left.png
		coin.png
		C.png
		C_pokemini.png
		C_pokemini_smaller.png
		c_right.png
		cross.png
		c_up.png
		digital.png
		dpad-down_no-mark.png
		dpad-down.png
		dpad-down_psx_no-mark.png
		dpad-down_psx.png
		dpad-left_no-mark.png
		dpad-left.png
		dpad-left_psx_no-mark.png
		dpad-left_psx.png
		dpad-right_no-mark.png
		dpad-right.png
		dpad-right_psx_no-mark.png
		dpad-right_psx.png
		dpad-up_no-mark.png
		dpad-up.png
		dpad-up_psx_no-mark.png
		dpad-up_psx.png
		D.png
		E.png
		fast_forward.png
		F.png
		genesis_mode.png
		hide.png
		III.png
		II.png
		I.png
		IV.png
		keyboard.png
		L1_down.png
		L1_down_smaller.png
		L1.png
		L1_smaller.png
		L2.png
		L2_up.png
		L3.png
		L3_smaller.png
		L_and_R_down.png
		L_and_R_left.png
		L_and_R.png
		L_down.png
		L_down_smaller_gba.png
		L_face.png
		L.png
		L_right.png
		L_right_smaller.png
		L_smaller.png
		no-analog.png
		overlay-A.png
		overlay-B.png
		overlay-C.png
		overlay-D.png
		pause_square_text.png
		pokemini_power.png
		pokemini_shake.png
		R1.png
		R1_smaller.png
		R2.png
		R2_up.png
		R3_smaller.png
		R_down.png
		R_down_smaller.png
		reset_square_text.png
		R_face.png
		rgui.png
		rotate.png
		R.png
		R_smaller.png
		select_psx.png
		select_rounded_big.png
		select_square_text.png
		show.png
		S_nxengine.png
		square.png
		start_dc.png
		start_genesis.png
		start.png
		start_psx.png
		start_rounded_big.png
		start_rounded.png
		test.png
		thumbstick-background.png
		thumbstick-pad_arcade.png
		thumbstick-pad-hollow.png
		thumbstick-pad.png
		triangle.png
		VI.png
		V.png
		W_nxengine.png
		X1_wswan.png
		X2_wswan.png
		X3_wswan.png
		X4_wswan.png
		X.png
		Y1_wswan.png
		Y2_wswan.png
		Y3_wswan.png
		Y4_wswan.png
		Y.png
		Z_down.png
		Z_down_smaller.png
		Z.png`.replace(/(\n)\s+/g, "$1").split("\n");

	window.defaultImagesObj = {};
	imageNames.forEach((el) => { defaultImagesObj[el] = "img/" + el });

	window.defaultConfigString = `overlays = 4
		overlay0_name = "landscape"
		overlay0_full_screen = true
		overlay0_normalized = true
		overlay0_range_mod = 1.5
		overlay0_alpha_mod = 2.0
		overlay0_aspect_ratio = 1.7777778
		overlay0_auto_x_separation = true
		overlay0_auto_y_separation = true
		overlay0_block_x_separation = false
		overlay0_block_y_separation = false
		overlay0_descs = 21
		overlay0_desc0 = "left,0.07188,0.77778,radial,0.04479,0.06852"
		overlay0_desc0_overlay = dpad-left.png
		overlay0_desc1 = "right,0.17813,0.77778,radial,0.04479,0.06852"
		overlay0_desc1_overlay = dpad-right.png
		overlay0_desc2 = "up,0.12500,0.68333,radial,0.03854,0.07963"
		overlay0_desc2_overlay = dpad-up.png
		overlay0_desc3 = "down,0.12500,0.87222,radial,0.03854,0.07963"
		overlay0_desc3_overlay = dpad-down.png
		overlay0_desc4 = "left|up,0.05625,0.65556,rect,0.03021,0.05370"
		overlay0_desc5 = "right|up,0.19375,0.65556,rect,0.03021,0.05370"
		overlay0_desc6 = "left|down,0.05625,0.90000,rect,0.03021,0.05370"
		overlay0_desc7 = "right|down,0.19375,0.90000,rect,0.03021,0.05370"
		overlay0_desc8 = "a,0.93750,0.77778,radial,0.04167,0.07407"
		overlay0_desc8_overlay = A.png
		overlay0_desc9 = "b,0.87500,0.88889,radial,0.04167,0.07407"
		overlay0_desc9_overlay = B.png
		overlay0_desc10 = "x,0.87500,0.66667,radial,0.04167,0.07407"
		overlay0_desc10_overlay = X.png
		overlay0_desc11 = "y,0.81250,0.77778,radial,0.04167,0.07407"
		overlay0_desc11_overlay = Y.png
		overlay0_desc12 = "start,0.60000,0.91852,rect,0.03958,0.04444"
		overlay0_desc12_overlay = start_psx.png
		overlay0_desc13 = "select,0.40000,0.91852,rect,0.04063,0.04259"
		overlay0_desc13_overlay = select_psx.png
		overlay0_desc14 = "l,0.02917,0.50000,rect,0.05208,0.09259"
		overlay0_desc14_overlay = L1.png
		overlay0_desc15 = "l2,0.02917,0.30000,rect,0.05208,0.09259"
		overlay0_desc15_overlay = L2.png
		overlay0_desc16 = "r,0.97083,0.50000,rect,0.05208,0.09259"
		overlay0_desc16_overlay = R1.png
		overlay0_desc17 = "r2,0.97083,0.30000,rect,0.05208,0.09259"
		overlay0_desc17_overlay = R2.png
		overlay0_desc18 = "menu_toggle,0.07800,0.08889,radial,0.02604,0.04629"
		overlay0_desc18_overlay = rgui.png
		overlay0_desc19 = "overlay_next,0.92200,0.08889,radial,0.02604,0.04629"
		overlay0_desc19_overlay = rotate.png
		overlay0_desc19_next_target = "portrait"
		overlay0_desc20 = "overlay_next,0.17800,0.08889,radial,0.02604,0.04629"
		overlay0_desc20_overlay = analog.png
		overlay0_desc20_next_target = "landscape-analog"
		overlay1_name = "portrait"
		overlay1_full_screen = true
		overlay1_normalized = true
		overlay1_range_mod = 1.5
		overlay1_alpha_mod = 2.0
		overlay1_aspect_ratio = 0.5625
		overlay1_auto_x_separation = true
		overlay1_auto_y_separation = false
		overlay1_block_x_separation = false
		overlay1_block_y_separation = false
		overlay1_descs = 21
		overlay1_desc0 = "left,0.12037,0.85417,radial,0.07963,0.03854"
		overlay1_desc0_overlay = dpad-left.png
		overlay1_desc1 = "right,0.30926,0.85417,radial,0.07963,0.03854"
		overlay1_desc1_overlay = dpad-right.png
		overlay1_desc2 = "up,0.21481,0.80104,radial,0.06852,0.04479"
		overlay1_desc2_overlay = dpad-up.png
		overlay1_desc3 = "down,0.21481,0.90729,radial,0.06852,0.04479"
		overlay1_desc3_overlay = dpad-down.png
		overlay1_desc4 = "left|up,0.09259,0.78542,rect,0.05370,0.03021"
		overlay1_desc5 = "right|up,0.33704,0.78542,rect,0.05370,0.03021"
		overlay1_desc6 = "left|down,0.09259,0.92292,rect,0.05370,0.03021"
		overlay1_desc7 = "right|down,0.33704,0.92292,rect,0.05370,0.03021"
		overlay1_desc8 = "a,0.88889,0.85417,radial,0.07407,0.04167"
		overlay1_desc8_overlay = A.png
		overlay1_desc9 = "b,0.77778,0.91667,radial,0.07407,0.04167"
		overlay1_desc9_overlay = B.png
		overlay1_desc10 = "x,0.77778,0.79167,radial,0.07407,0.04167"
		overlay1_desc10_overlay = X.png
		overlay1_desc11 = "y,0.66667,0.85417,radial,0.07407,0.04167"
		overlay1_desc11_overlay = Y.png
		overlay1_desc12 = "start,0.70000,0.65000,rect,0.07037,0.02500"
		overlay1_desc12_overlay = start_psx.png
		overlay1_desc13 = "select,0.30000,0.65000,rect,0.07222,0.02396"
		overlay1_desc13_overlay = select_psx.png
		overlay1_desc14 = "l,0.04815,0.68021,rect,0.09259,0.05208"
		overlay1_desc14_overlay = L1.png
		overlay1_desc15 = "l2,0.04815,0.56771,rect,0.09259,0.05208"
		overlay1_desc15_overlay = L2.png
		overlay1_desc16 = "r,0.95185,0.68021,rect,0.09259,0.05208"
		overlay1_desc16_overlay = R1.png
		overlay1_desc17 = "r2,0.95185,0.56771,rect,0.09259,0.05208"
		overlay1_desc17_overlay = R2.png
		overlay1_desc18 = "menu_toggle,0.5,0.65000,radial,0.04633,0.02604"
		overlay1_desc18_overlay = rgui.png
		overlay1_desc19 = "overlay_next,0.5,0.55000,radial,0.04633,0.02604"
		overlay1_desc19_overlay = rotate.png
		overlay1_desc19_next_target = "landscape"
		overlay1_desc20 = "overlay_next,0.30000,0.55000,radial,0.04629,0.02604"
		overlay1_desc20_overlay = analog.png
		overlay1_desc20_next_target = "portrait-analog"
		overlay2_name = "landscape-analog"
		overlay2_full_screen = true
		overlay2_normalized = true
		overlay2_range_mod = 1.5
		overlay2_alpha_mod = 2.0
		overlay2_aspect_ratio = 1.7777778
		overlay2_auto_x_separation = true
		overlay2_auto_y_separation = true
		overlay2_block_x_separation = false
		overlay2_block_y_separation = false
		overlay2_descs = 15
		overlay2_desc0 = "a,0.93750,0.77778,radial,0.04167,0.07407"
		overlay2_desc0_overlay = A.png
		overlay2_desc1 = "b,0.87500,0.88889,radial,0.04167,0.07407"
		overlay2_desc1_overlay = B.png
		overlay2_desc2 = "x,0.87500,0.66667,radial,0.04167,0.07407"
		overlay2_desc2_overlay = X.png
		overlay2_desc3 = "y,0.81250,0.77778,radial,0.04167,0.07407"
		overlay2_desc3_overlay = Y.png
		overlay2_desc4 = "start,0.60000,0.91852,rect,0.03958,0.04444"
		overlay2_desc4_overlay = start_psx.png
		overlay2_desc5 = "select,0.40000,0.91852,rect,0.04063,0.04259"
		overlay2_desc5_overlay = select_psx.png
		overlay2_desc6 = "l,0.02917,0.50000,rect,0.05208,0.09259"
		overlay2_desc6_overlay = L1.png
		overlay2_desc7 = "l2,0.02917,0.30000,rect,0.05208,0.09259"
		overlay2_desc7_overlay = L2.png
		overlay2_desc8 = "r,0.97083,0.50000,rect,0.05208,0.09259"
		overlay2_desc8_overlay = R1.png
		overlay2_desc9 = "r2,0.97083,0.30000,rect,0.05208,0.09259"
		overlay2_desc9_overlay = R2.png
		overlay2_desc10 = "menu_toggle,0.07800,0.08889,radial,0.02604,0.04629"
		overlay2_desc10_overlay = rgui.png
		overlay2_desc11 = "overlay_next,0.92200,0.08889,radial,0.02604,0.04629"
		overlay2_desc11_overlay = rotate.png
		overlay2_desc11_next_target = "portrait-analog"
		overlay2_desc12 = "overlay_next,0.82200,0.08889,radial,0.02604,0.04629"
		overlay2_desc12_overlay = digital.png
		overlay2_desc12_next_target = "landscape"
		overlay2_desc13 = "null,0.12500,0.77778,rect,0.09000,0.16"
		overlay2_desc13_overlay = thumbstick-background.png
		overlay2_desc14 = "analog_left,0.12500,0.77778,radial,0.09000,0.16"
		overlay2_desc14_overlay = thumbstick-pad_arcade.png
		overlay2_desc14_range_mod = 2.0
		overlay2_desc14_saturate_pct = 0.65
		overlay2_desc14_movable = true
		overlay3_name = "portrait-analog"
		overlay3_full_screen = true
		overlay3_normalized = true
		overlay3_range_mod = 1.5
		overlay3_alpha_mod = 2.0
		overlay3_aspect_ratio = 0.5625
		overlay3_auto_x_separation = true
		overlay3_auto_y_separation = false
		overlay3_block_x_separation = false
		overlay3_block_y_separation = false
		overlay3_descs = 15
		overlay3_desc0 = "a,0.88889,0.85417,radial,0.07407,0.04167"
		overlay3_desc0_overlay = A.png
		overlay3_desc1 = "b,0.77778,0.91667,radial,0.07407,0.04167"
		overlay3_desc1_overlay = B.png
		overlay3_desc2 = "x,0.77778,0.79167,radial,0.07407,0.04167"
		overlay3_desc2_overlay = X.png
		overlay3_desc3 = "y,0.66667,0.85417,radial,0.07407,0.04167"
		overlay3_desc3_overlay = Y.png
		overlay3_desc4 = "start,0.70000,0.65000,rect,0.07037,0.02500"
		overlay3_desc4_overlay = start_psx.png
		overlay3_desc5 = "select,0.30000,0.65000,rect,0.07222,0.02396"
		overlay3_desc5_overlay = select_psx.png
		overlay3_desc6 = "l,0.04815,0.68021,rect,0.09259,0.05208"
		overlay3_desc6_overlay = L1.png
		overlay3_desc7 = "l2,0.04815,0.56771,rect,0.09259,0.05208"
		overlay3_desc7_overlay = L2.png
		overlay3_desc8 = "r,0.95185,0.68021,rect,0.09259,0.05208"
		overlay3_desc8_overlay = R1.png
		overlay3_desc9 = "r2,0.95185,0.56771,rect,0.09259,0.05208"
		overlay3_desc9_overlay = R2.png
		overlay3_desc10 = "menu_toggle,0.5,0.65000,radial,0.04633,0.02604"
		overlay3_desc10_overlay = rgui.png
		overlay3_desc11 = "overlay_next,0.5,0.55000,radial,0.04633,0.02604"
		overlay3_desc11_overlay = rotate.png
		overlay3_desc11_next_target = "landscape-analog"
		overlay3_desc12 = "overlay_next,0.70000,0.55000,radial,0.04629,0.02604"
		overlay3_desc12_overlay = digital.png
		overlay3_desc12_next_target = "portrait"
		overlay3_desc13 = "null,0.21481,0.85417,rect,0.16000,0.09000"
		overlay3_desc13_overlay = thumbstick-background.png
		overlay3_desc14 = "analog_left,0.21481,0.85417,radial,0.16000,0.09000"
		overlay3_desc14_overlay = thumbstick-pad_arcade.png
		overlay3_desc14_range_mod = 2.0
		overlay3_desc14_saturate_pct = 0.65
		overlay3_desc14_movable = true`.replace(/(\n)\s+/g, "$1");
}